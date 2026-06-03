import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as T
import torch.nn.functional as F
import numpy as np
from PIL import Image
from typing import Optional
import os
import io


# ─────────────────────────────────────────────────────────────────────────────
# Feature Extractor
#
# We use WideResNet50 pretrained on ImageNet as our backbone.
# We never update its weights — it is frozen and used purely as a feature
# extractor. We pull features from layer2 and layer3 because they capture
# both fine-grained textures (layer2) and higher-level structure (layer3).
# Combining both gives a richer description of each image patch.
# ─────────────────────────────────────────────────────────────────────────────

class FeatureExtractor(nn.Module):

    def __init__(self, device):
        super().__init__()
        self.device = device

        weights  = models.Wide_ResNet50_2_Weights.IMAGENET1K_V1
        backbone = models.wide_resnet50_2(weights=weights)

        self.layer2 = nn.Sequential(
            backbone.conv1, backbone.bn1, backbone.relu,
            backbone.maxpool, backbone.layer1, backbone.layer2
        ).to(device).eval()

        self.layer3 = nn.Sequential(
            backbone.layer3
        ).to(device).eval()

        # Freeze all weights — we never retrain the backbone
        for param in self.parameters():
            param.requires_grad = False

    def forward(self, x):
        with torch.no_grad():
            feat2 = self.layer2(x)
            feat3 = self.layer3(feat2)

            # Upsample layer3 to match layer2 spatial size so we can concatenate
            feat3 = F.interpolate(
                feat3, size=feat2.shape[-2:],
                mode='bilinear', align_corners=False
            )

            # Concatenate: 512 (layer2) + 1024 (layer3) = 1536 channels per patch
            return torch.cat([feat2, feat3], dim=1)


# ─────────────────────────────────────────────────────────────────────────────
# PatchCore Inference
#
# This class loads a pre-trained memory bank and runs inference on new images.
# The memory bank was built during training by processing all normal images
# through the FeatureExtractor and storing the resulting patch features.
#
# At inference time we compare each patch of the new image to the memory bank
# using k-nearest neighbor distance. High distance = anomaly.
#
# If the model file is not found locally, we automatically download it from
# Hugging Face Hub. This is what makes deployment on Render/HF Spaces work
# without including the large .pt files in the GitHub repository.
# ─────────────────────────────────────────────────────────────────────────────

class PatchCoreInference:

    def __init__(self, category: str, models_dir: Optional[str] = None):
        self.category = category
        self.device   = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # Default models directory is backend/models/ relative to this file
        if models_dir is None:
            models_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'models'
            )

        os.makedirs(models_dir, exist_ok=True)
        model_path = os.path.join(models_dir, f'{category}_memory_bank.pt')

        # Download from Hugging Face if not present locally
        # This runs automatically on first startup in production (Render, HF Spaces)
        if not os.path.exists(model_path):
            print(f'Model not found locally. Downloading {category} from Hugging Face...')
            try:
                from huggingface_hub import hf_hub_download
                hf_hub_download(
                    repo_id='Salim118/visionguard-patchcore-models',
                    filename=f'{category}_memory_bank.pt',
                    local_dir=models_dir
                )
                print(f'Downloaded: {category}_memory_bank.pt')
            except Exception as e:
                raise FileNotFoundError(
                    f'Model not found locally and Hugging Face download failed.\n'
                    f'Error: {e}\n'
                    f'Run the training notebook to generate model files.'
                )

        # Load the feature extractor (WideResNet50 backbone)
        self.extractor = FeatureExtractor(self.device)

        # Load the memory bank — this is what PatchCore "knows" about normal
        self.memory_bank = torch.load(model_path, map_location='cpu')
        print(f'PatchCore ready: {category} ({self.memory_bank.shape[0]} patches, device={self.device})')

        # Image preprocessing pipeline — must match exactly what was used in training
        self.transform = T.Compose([
            T.Resize((256, 256)),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def _run_inference(self, img: Image.Image):
        # Convert image to tensor and extract patch features
        tensor     = self.transform(img).unsqueeze(0).to(self.device) # type: ignore
        features   = self.extractor(tensor)
        B, C, H, W = features.shape
        patches    = features.permute(0, 2, 3, 1).reshape(-1, C).cpu()

        # Normalize before distance computation
        # This removes scale differences and focuses on feature direction
        patches_norm = F.normalize(patches, dim=1)
        memory_norm  = F.normalize(self.memory_bank, dim=1)

        # Compute k-nearest neighbor distances to memory bank
        # We average 9 neighbors for stability — single nearest neighbor
        # is too sensitive to outliers in the memory bank
        distances    = torch.cdist(patches_norm, memory_norm)
        knn, _       = distances.topk(9, dim=1, largest=False)
        patch_scores = knn.mean(dim=1)

        # Reshape patch scores into spatial heatmap and normalize to 0-1
        heatmap = patch_scores.reshape(H, W).numpy()
        lo, hi  = heatmap.min(), heatmap.max()
        heatmap = (heatmap - lo) / (hi - lo + 1e-8)

        # Upsample heatmap to 224x224 to match original image resolution
        t       = torch.from_numpy(heatmap).unsqueeze(0).unsqueeze(0)
        t       = F.interpolate(t, size=(224, 224), mode='bilinear', align_corners=False)
        heatmap = t.squeeze().numpy()

        # Overall image score = maximum patch score
        # One defective patch is enough to flag the whole part
        anomaly_score = float(patch_scores.max().item())

        return anomaly_score, heatmap.tolist()

    def predict(self, image_path: str):
        """
        Run inference on an image file path.
        Used during local testing and development.
        """
        img = Image.open(image_path).convert('RGB')
        return self._run_inference(img)

    def predict_from_bytes(self, image_bytes: bytes):
        """
        Run inference on raw image bytes.
        Used by FastAPI when receiving uploaded files from the frontend.
        """
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return self._run_inference(img)
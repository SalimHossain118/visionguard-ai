import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as T
import torch.nn.functional as F
import numpy as np
from PIL import Image
import os
from typing import Optional


class FeatureExtractor(nn.Module):
    """
    WideResNet50 feature extractor — same as training notebook.
    Must be identical to the one used during training.
    """

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

        for param in self.parameters():
            param.requires_grad = False

    def forward(self, x):
        with torch.no_grad():
            feat2 = self.layer2(x)
            feat3 = self.layer3(feat2)
            feat3 = F.interpolate(
                feat3, size=feat2.shape[-2:],
                mode='bilinear', align_corners=False
            )
            return torch.cat([feat2, feat3], dim=1)


class PatchCoreInference:
    """
    Production inference class for VisionGuard AI backend.
    Loads a pre-trained memory bank and runs inference on new images.

    Usage:
        model = PatchCoreInference('metal_nut')
        score, heatmap = model.predict('path/to/image.png')
    """

    def __init__(self, category: str, models_dir: Optional[str] = None):
        self.category  = category
        self.device    = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        if models_dir is None:
            models_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'models'
            )

        model_path = os.path.join(models_dir, f'{category}_memory_bank.pt')

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f'Model not found: {model_path}\n'
                f'Run the training notebook first.'
            )

        # Load feature extractor
        self.extractor   = FeatureExtractor(self.device)

        # Load memory bank
        self.memory_bank = torch.load(model_path, map_location='cpu')
        print(f'PatchCore loaded: {category} ({self.memory_bank.shape[0]} patches)')

        # Image preprocessing — must match training
        self.transform = T.Compose([
            T.Resize((256, 256)),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def predict(self, image_path: str):
        """
        Run inference on a single image.

        Returns:
            anomaly_score: float — overall anomaly level (0 to 1+)
            heatmap: list — 224x224 anomaly map as nested list
        """
        img     = Image.open(image_path).convert('RGB')
        tensor  = self.transform(img).unsqueeze(0).to(self.device)

        # Extract features
        features   = self.extractor(tensor)
        B, C, H, W = features.shape
        patches    = features.permute(0, 2, 3, 1).reshape(-1, C).cpu()

        # Compute distances to memory bank
        patches_norm = F.normalize(patches, dim=1)
        memory_norm  = F.normalize(self.memory_bank, dim=1)

        distances    = torch.cdist(patches_norm, memory_norm)
        knn, _       = distances.topk(9, dim=1, largest=False)
        patch_scores = knn.mean(dim=1)

        # Generate heatmap
        heatmap = patch_scores.reshape(H, W).numpy()
        lo, hi  = heatmap.min(), heatmap.max()
        heatmap = (heatmap - lo) / (hi - lo + 1e-8)

        # Upsample to 224x224
        t       = torch.from_numpy(heatmap).unsqueeze(0).unsqueeze(0)
        t       = F.interpolate(t, size=(224, 224), mode='bilinear', align_corners=False)
        heatmap = t.squeeze().numpy()

        anomaly_score = float(patch_scores.max().item())

        return anomaly_score, heatmap.tolist()

    def predict_from_bytes(self, image_bytes: bytes):
        """
        Run inference on image bytes directly.
        Used by FastAPI when receiving uploaded files.
        """
        import io
        img     = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        tensor  = self.transform(img).unsqueeze(0).to(self.device)

        features   = self.extractor(tensor)
        B, C, H, W = features.shape
        patches    = features.permute(0, 2, 3, 1).reshape(-1, C).cpu()

        patches_norm = F.normalize(patches, dim=1)
        memory_norm  = F.normalize(self.memory_bank, dim=1)

        distances    = torch.cdist(patches_norm, memory_norm)
        knn, _       = distances.topk(9, dim=1, largest=False)
        patch_scores = knn.mean(dim=1)

        heatmap = patch_scores.reshape(H, W).numpy()
        lo, hi  = heatmap.min(), heatmap.max()
        heatmap = (heatmap - lo) / (hi - lo + 1e-8)

        t       = torch.from_numpy(heatmap).unsqueeze(0).unsqueeze(0)
        t       = F.interpolate(t, size=(224, 224), mode='bilinear', align_corners=False)
        heatmap = t.squeeze().numpy()

        anomaly_score = float(patch_scores.max().item())

        return anomaly_score, heatmap.tolist()
import os
from huggingface_hub import hf_hub_download, list_repo_files

REPO_ID = "Salim118/visionguard-patchcore-models"
CATEGORIES = ["metal_nut", "transistor", "leather"]


def download_samples(base_dir: str = None):
    """
    Downloads sample images from HF Hub on startup.
    Only downloads if not already present locally.
    This keeps Git clean — no binary files in the repository.
    """
    base_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'data', 'samples'
)

    os.makedirs(base_dir, exist_ok=True)

    # Check if samples already exist
    existing = sum(
        len(os.listdir(os.path.join(base_dir, cat)))
        for cat in CATEGORIES
        if os.path.exists(os.path.join(base_dir, cat))
    )

    if existing > 0:
        print(f"Samples already present ({existing} images). Skipping download.")
        return

    print("Downloading sample images from Hugging Face Hub...")

    try:
        # List all files in the samples/ folder on HF Hub
        all_files = list(list_repo_files(REPO_ID))
        sample_files = [f for f in all_files if f.startswith("samples/")]

        for file_path in sample_files:
            # file_path is like samples/metal_nut/001.png
            parts = file_path.split("/")
            if len(parts) < 3:
                continue

            category = parts[1]
            filename = parts[2]
            local_dir = os.path.join(base_dir, category)
            os.makedirs(local_dir, exist_ok=True)

            local_file = os.path.join(local_dir, filename)
            if not os.path.exists(local_file):
                hf_hub_download(
                    repo_id=REPO_ID,
                    filename=file_path,
                    local_dir=os.path.dirname(base_dir)
                )

        print(f"Sample images downloaded successfully.")

    except Exception as e:
        print(f"Warning: Could not download samples: {e}")
        print("Sample images will not be available in the demo.")
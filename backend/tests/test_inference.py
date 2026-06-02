import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cv.patchcore import PatchCoreInference

model = PatchCoreInference('metal_nut')
score, heatmap = model.predict('backend/data/test_image.png')

print(f'Anomaly score : {score:.4f}')
print(f'Heatmap shape : {len(heatmap)}x{len(heatmap[0])}')
print(f'Decision      : {"DEFECTIVE" if score > 0.5 else "NORMAL"}')
"""
X-Ray Mike - 學術級透視圖像處理模型
支持多種透視模式和圖像增強算法
"""

import torch
import numpy as np
from PIL import Image
import cv2
from typing import Optional
from cog import BasePredictor, Input, Path
import io
import tempfile


class Predictor(BasePredictor):
    """X-Ray Mike 預測器"""

    def setup(self):
        """加載模型和初始化（如果需要預訓練權重）"""
        print("✅ X-Ray Mike 初始化完成")
        # 如果有預訓練模型權重，在這裡加載
        # self.model = torch.load("weights.pth")

    def predict(
        self,
        image: Path = Input(description="輸入圖片"),
        mode: str = Input(
            description="透視模式",
            default="clahe",
            choices=["neutral", "clahe", "retinex", "adaptive", "wavelet", "gradient"]
        ),
        intensity: float = Input(
            description="透視強度 (0-10)",
            default=4.5,
            ge=0,
            le=10
        ),
        sharpen: float = Input(
            description="銳化強度 (0-3)",
            default=1.0,
            ge=0,
            le=3
        ),
        edge: float = Input(
            description="邊緣增強 (0-1)",
            default=0.4,
            ge=0,
            le=1
        ),
        contrast: float = Input(
            description="對比度調整 (0.5-2.0)",
            default=1.0,
            ge=0.5,
            le=2.0
        ),
    ) -> Path:
        """
        執行 X-ray 透視處理

        Args:
            image: 輸入圖片路徑
            mode: 透視模式
            intensity: 透視強度
            sharpen: 銳化強度
            edge: 邊緣增強
            contrast: 對比度

        Returns:
            處理後的圖片路徑
        """

        print(f"🔍 開始處理圖片 - 模式: {mode}, 強度: {intensity}")

        # 1. 讀取圖片
        img = Image.open(image).convert('RGB')
        img_array = np.array(img)

        # 2. 轉換到適合處理的格式
        img_gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        img_processed = img_array.copy()

        # 3. 根據模式應用不同的透視算法
        if mode == "clahe":
            img_processed = self._apply_clahe(img_gray, intensity)
        elif mode == "retinex":
            img_processed = self._apply_retinex(img_array, intensity)
        elif mode == "adaptive":
            img_processed = self._apply_adaptive(img_gray, intensity)
        elif mode == "wavelet":
            img_processed = self._apply_wavelet(img_array, intensity)
        elif mode == "gradient":
            img_processed = self._apply_gradient(img_gray, intensity)
        else:  # neutral
            img_processed = self._apply_neutral(img_gray, intensity)

        # 4. 應用銳化
        if sharpen > 0:
            img_processed = self._apply_sharpen(img_processed, sharpen)

        # 5. 應用邊緣增強
        if edge > 0:
            img_processed = self._apply_edge(img_processed, edge)

        # 6. 應用對比度調整
        if contrast != 1.0:
            img_processed = self._apply_contrast(img_processed, contrast)

        # 7. 確保數值範圍正確
        img_processed = np.clip(img_processed, 0, 255).astype(np.uint8)

        # 8. 保存結果
        output_path = Path(tempfile.mktemp(suffix=".png"))
        result_img = Image.fromarray(img_processed)
        result_img.save(output_path, format='PNG', quality=95)

        print(f"✅ 處理完成: {output_path}")

        return output_path

    def _apply_clahe(self, img_gray: np.ndarray, intensity: float) -> np.ndarray:
        """CLAHE (對比度限制自適應直方圖均衡化)"""
        clip_limit = 2.0 + intensity * 0.5
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
        img_clahe = clahe.apply(img_gray)
        return cv2.cvtColor(img_clahe, cv2.COLOR_GRAY2RGB)

    def _apply_retinex(self, img: np.ndarray, intensity: float) -> np.ndarray:
        """Retinex MSR (多尺度 Retinex)"""
        img_float = img.astype(np.float32) + 1.0

        # 多尺度
        scales = [15, 80, 250]
        msr = np.zeros_like(img_float)

        for scale in scales:
            blur = cv2.GaussianBlur(img_float, (0, 0), scale)
            msr += np.log10(img_float) - np.log10(blur)

        msr = msr / len(scales)
        msr = msr * intensity * 10

        # 歸一化
        msr = cv2.normalize(msr, None, 0, 255, cv2.NORM_MINMAX)
        return msr.astype(np.uint8)

    def _apply_adaptive(self, img_gray: np.ndarray, intensity: float) -> np.ndarray:
        """自適應增強"""
        block_size = int(31 + intensity * 10)
        if block_size % 2 == 0:
            block_size += 1

        img_adaptive = cv2.adaptiveThreshold(
            img_gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            block_size, 2
        )

        # 反轉並混合
        img_inv = 255 - img_adaptive
        alpha = min(intensity / 10, 0.8)
        img_blend = cv2.addWeighted(img_gray, 1 - alpha, img_inv, alpha, 0)

        return cv2.cvtColor(img_blend, cv2.COLOR_GRAY2RGB)

    def _apply_wavelet(self, img: np.ndarray, intensity: float) -> np.ndarray:
        """小波變換增強（簡化版）"""
        # 使用拉普拉斯金字塔模擬小波效果
        gaussian = cv2.GaussianBlur(img, (5, 5), 0)
        laplacian = cv2.subtract(img, gaussian)

        # 增強高頻細節
        enhanced = cv2.addWeighted(img, 1.0, laplacian, intensity * 0.5, 0)
        return enhanced

    def _apply_gradient(self, img_gray: np.ndarray, intensity: float) -> np.ndarray:
        """梯度熱圖"""
        # Sobel 梯度
        grad_x = cv2.Sobel(img_gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(img_gray, cv2.CV_64F, 0, 1, ksize=3)

        # 計算梯度幅度
        magnitude = np.sqrt(grad_x**2 + grad_y**2)
        magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
        magnitude = magnitude.astype(np.uint8)

        # 應用熱圖
        heatmap = cv2.applyColorMap(magnitude, cv2.COLORMAP_JET)

        # 混合原圖
        alpha = min(intensity / 10, 0.7)
        img_rgb = cv2.cvtColor(img_gray, cv2.COLOR_GRAY2RGB)
        blended = cv2.addWeighted(img_rgb, 1 - alpha, heatmap, alpha, 0)

        return blended

    def _apply_neutral(self, img_gray: np.ndarray, intensity: float) -> np.ndarray:
        """標準透視增強"""
        # 基礎對比度增強
        enhanced = cv2.convertScaleAbs(img_gray, alpha=1 + intensity * 0.1, beta=0)
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)

    def _apply_sharpen(self, img: np.ndarray, strength: float) -> np.ndarray:
        """銳化"""
        kernel = np.array([
            [0, -1, 0],
            [-1, 5 + strength, -1],
            [0, -1, 0]
        ])
        return cv2.filter2D(img, -1, kernel)

    def _apply_edge(self, img: np.ndarray, strength: float) -> np.ndarray:
        """邊緣增強"""
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        else:
            gray = img

        edges = cv2.Canny(gray, 50, 150)
        edges_rgb = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)

        return cv2.addWeighted(img, 1.0, edges_rgb, strength * 0.3, 0)

    def _apply_contrast(self, img: np.ndarray, contrast: float) -> np.ndarray:
        """對比度調整"""
        return cv2.convertScaleAbs(img, alpha=contrast, beta=0)

import torch
import torch.nn as nn
import torch.nn.functional as F


class DARCBlock(nn.Module):
    def __init__(self, channels=64, embedding_dim=32):
        super().__init__()
        self.norm = nn.GroupNorm(8, channels)
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1)
        self.dwconv = nn.Conv2d(channels, channels, 3, padding=1, groups=channels)
        self.act = nn.GELU()
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1)
        self.film = nn.Linear(embedding_dim, channels * 2)

    def forward(self, x, noise_embedding):
        residual = x
        h = self.norm(x)
        h = self.conv1(h)
        h = self.dwconv(h)
        h = self.act(h)
        h = self.conv2(h)

        gamma, beta = self.film(noise_embedding).chunk(2, dim=1)
        gamma = gamma[:, :, None, None]
        beta = beta[:, :, None, None]
        h = h * (1.0 + gamma) + beta
        return residual + h


class NoiseDegradationEstimator(nn.Module):
    def __init__(self, channels=64, embedding_dim=32):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(channels, channels, 3, padding=1),
            nn.GELU(),
            nn.Conv2d(channels, channels, 3, padding=1),
            nn.GELU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.fc = nn.Linear(channels, embedding_dim)

    def forward(self, x):
        return self.fc(self.encoder(x).flatten(1))


class DARCNet(nn.Module):
    def __init__(self, in_channels=1, out_channels=1, channels=64,
                 num_blocks=8, embedding_dim=32):
        super().__init__()
        self.shallow = nn.Conv2d(in_channels, channels, 3, padding=1)
        self.degradation_estimator = NoiseDegradationEstimator(
            channels, embedding_dim
        )
        self.blocks = nn.ModuleList([
            DARCBlock(channels, embedding_dim) for _ in range(num_blocks)
        ])
        self.trunk_conv = nn.Conv2d(channels, channels, 3, padding=1)

        self.upsampler = nn.Sequential(
            nn.Conv2d(channels, channels * 4, 3, padding=1),
            nn.GELU(),
            nn.PixelShuffle(2),
        )
        self.reconstruction = nn.Conv2d(channels, out_channels, 3, padding=1)

    def forward(self, x):
        shallow = self.shallow(x)
        noise_embedding = self.degradation_estimator(shallow)

        h = shallow
        for block in self.blocks:
            h = block(h, noise_embedding)

        h = self.trunk_conv(h) + shallow
        h = self.upsampler(h)
        learned_residual = self.reconstruction(h)

        bicubic = F.interpolate(
            x, scale_factor=2, mode="bicubic", align_corners=False
        )
        return bicubic + learned_residual


if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DARCNet().to(device)
    x = torch.randn(2, 1, 128, 128, device=device)
    with torch.no_grad():
        y = model(x)
    print("Device:", device)
    if device.type == "cuda":
        print("GPU:", torch.cuda.get_device_name(0))
    print("Input shape: ", tuple(x.shape))
    print("Output shape:", tuple(y.shape))
    assert tuple(y.shape) == (2, 1, 256, 256)
    print("DARC-Net forward pass: SUCCESS")
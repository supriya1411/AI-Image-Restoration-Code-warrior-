print("=============================================")
print("KLA IMAGE RESTORATION - MODEL COMPARISON")
print("=============================================\n")

models = {
    "Baseline CNN": {
        "PSNR": 23.6653,
        "SSIM": 0.6702,
        "LPIPS": 0.4966,
    },

    "DARC-Net + L1": {
        "PSNR": 25.4513,
        "SSIM": 0.7631,
        "LPIPS": 0.2972,
    },

    "DARC-Net + Combined Loss": {
        "PSNR": 25.4332,
        "SSIM": 0.7710,
        "LPIPS": 0.2565,
    },
}


print(
    f"{'Model':<30}"
    f"{'PSNR':>12}"
    f"{'SSIM':>12}"
    f"{'LPIPS':>12}"
)

print("-" * 66)

for name, results in models.items():

    print(
        f"{name:<30}"
        f"{results['PSNR']:>12.4f}"
        f"{results['SSIM']:>12.4f}"
        f"{results['LPIPS']:>12.4f}"
    )


print("\n=============================================")
print("BEST RESULTS")
print("=============================================")

print(
    f"Best PSNR  : "
    f"DARC-Net + L1 "
    f"({models['DARC-Net + L1']['PSNR']:.4f} dB)"
)

print(
    f"Best SSIM  : "
    f"DARC-Net + Combined Loss "
    f"({models['DARC-Net + Combined Loss']['SSIM']:.4f})"
)

print(
    f"Best LPIPS : "
    f"DARC-Net + Combined Loss "
    f"({models['DARC-Net + Combined Loss']['LPIPS']:.4f})"
)

print("\n=============================================")
import requests

url = "http://127.0.0.1:8000/restore"

with open("test_input.png", "rb") as f:
    response = requests.post(
        url,
        files={
            "file": (
                "test_input.png",
                f,
                "image/png"
            )
        }
    )

print("Status:", response.status_code)

if response.status_code == 200:

    with open(
        "api_restored.png",
        "wb"
    ) as output:

        output.write(response.content)

    print("SUCCESS!")
    print("Saved: api_restored.png")

    print(
        "Input:",
        response.headers.get("X-Original-Width"),
        "x",
        response.headers.get("X-Original-Height")
    )

    print(
        "Output:",
        response.headers.get("X-Output-Width"),
        "x",
        response.headers.get("X-Output-Height")
    )

else:
    print(response.text)
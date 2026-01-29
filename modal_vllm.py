import json
from typing import Any

import aiohttp
import modal

# Modal + vLLM OpenAI-compatible server for Mistral 3B
# Deploy with: modal deploy modal_vllm.py
# Test once with: modal run modal_vllm.py

MODEL_NAME = "mistralai/Ministral-3-3B-Instruct-2512"
N_GPU = 1
MINUTES = 60  # seconds
VLLM_PORT = 8000

# For frequent cold starts, keep this True.
FAST_BOOT = True

app = modal.App("showroom-ministral-3b")

vllm_image = (
    modal.Image.from_registry("nvidia/cuda:12.8.0-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .uv_pip_install(
        "vllm==0.13.0",
        "huggingface-hub==0.36.0",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})
)

hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)
vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)


@app.function(
    image=vllm_image,
    gpu=f"H100:{N_GPU}",
    scaledown_window=15 * MINUTES,  # scale to zero after idle
    timeout=10 * MINUTES,
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
)
@modal.concurrent(max_inputs=32)
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
def serve():
    import subprocess

    cmd = [
        "vllm",
        "serve",
        "--uvicorn-log-level=info",
        MODEL_NAME,
        "--served-model-name",
        MODEL_NAME,
        "--host",
        "0.0.0.0",
        "--port",
        str(VLLM_PORT),
        "--tokenizer_mode",
        "mistral",
        "--config_format",
        "mistral",
        "--load_format",
        "mistral",
        "--max-model-len",
        "8192",
    ]

    # Faster cold starts vs peak throughput.
    if FAST_BOOT:
        cmd += ["--enforce-eager"]

    # Assume multiple GPUs are for tensor parallelism.
    cmd += ["--tensor-parallel-size", str(N_GPU)]

    print(*cmd)
    subprocess.Popen(cmd)


@app.local_entrypoint()
async def test(test_timeout=10 * MINUTES, content=None):
    url = serve.get_web_url()

    if content is None:
        content = "Give me a short, friendly response about a car purchase."

    messages = [
        {"role": "system", "content": "You are a helpful, concise assistant."},
        {"role": "user", "content": content},
    ]

    async with aiohttp.ClientSession(base_url=url) as session:
        async with session.get("/v1/models", timeout=test_timeout - 1 * MINUTES) as resp:
            up = resp.status == 200
        assert up, f"Failed /v1/models check for server at {url}"

        payload: dict[str, Any] = {"messages": messages, "model": MODEL_NAME}
        headers = {"Content-Type": "application/json"}
        async with session.post("/v1/chat/completions", json=payload, headers=headers) as resp:
            resp.raise_for_status()
            data = await resp.json()
            print(json.dumps(data, indent=2))

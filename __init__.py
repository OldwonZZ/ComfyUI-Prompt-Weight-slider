import json
import re
from typing import Dict, List


CATEGORY = "Prompt Slider"


def _parse_prompt_tokens(raw_text: str) -> List[str]:
    """Parse comma or newline separated prompts, remove duplicates, preserve order."""
    if not raw_text:
        return []
    tokens = []
    for chunk in re.split(r"[\n,]+", raw_text):
        token = chunk.strip()
        if token and token not in tokens:
            tokens.append(token)
    return tokens


def _format_float(value: float) -> str:
    """Format float to exactly one decimal place."""
    return f"{value:.1f}"


class PromptStrengthSlider:
    """Assigns strengths to prompts and emits a formatted string."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompts": (
                    "STRING",
                    {
                        "forceInput": True,
                        "tooltip": "Connect a STRING of prompts (comma/newline separated)",
                    },
                ),
            },
            "hidden": {
                "strengths_json": "STRING",
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("output",)
    FUNCTION = "apply_strengths"
    CATEGORY = CATEGORY

    def apply_strengths(
        self,
        prompts: str = "",
        strengths_json: str = "",
    ):
        prompts, strengths = self._extract_prompts_and_strengths(strengths_json)

        normalized: Dict[str, float] = {}
        formatted_pairs = []
        for prompt in prompts:
            value = strengths.get(prompt, 1.0)
            if value < 0.0:
                value = 0.0
            if value > 2.0:
                value = 2.0
            normalized[prompt] = value
            formatted_pairs.append(f"({prompt}:{_format_float(value)})")

        formatted = ",".join(formatted_pairs)
        return (formatted,)

    @staticmethod
    def _extract_prompts_and_strengths(raw_json: str) -> (List[str], Dict[str, float]):
        prompts: List[str] = []
        if not raw_json:
            return prompts, {}
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError:
            return prompts, {}

        meta_prompts = payload.get("__prompts__")
        order_meta = payload.get("__order__")
        if isinstance(meta_prompts, list):
            prompts = [str(item).strip() for item in meta_prompts if str(item).strip()]
        elif isinstance(order_meta, list):
            candidates = []
            for entry in order_meta:
                if isinstance(entry, dict):
                    name = entry.get("id") or entry.get("label") or entry.get("displayLabel")
                    if name and str(name).strip():
                        candidates.append(str(name).strip())
            prompts = candidates
        if not prompts:
            prompts = [key for key in payload.keys() if not key.startswith("__") and not key.isdigit()]
            prompts.sort()

        strengths = {}
        for index, prompt in enumerate(prompts):
            value = payload.get(prompt)
            if value is None:
                value = payload.get(str(index))
            try:
                strengths[prompt] = float(value)
            except (TypeError, ValueError):
                strengths[prompt] = 1.0

        return prompts, strengths


NODE_CLASS_MAPPINGS = {
    "PromptStrengthSlider": PromptStrengthSlider,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptStrengthSlider": "Prompt weight slider",
}

WEB_DIRECTORY = "./js"

__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS",
    "WEB_DIRECTORY",
]


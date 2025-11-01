**Prompt Weight Slider**

*Fast equalizer for you prompts.*

Note: This module is designed for SDXL or SD1.5 series models that support prompt weighting syntax like (happy:1.2).
It’s a ComfyUI node that lets you adjust keyword weights just like tuning an audio EQ. You can quickly assign weight values to a group of prompts and output them in a unified string format for downstream nodes.

**🌟 Features**

Manage multiple prompt weights in bulk, all at once

Intuitive, fast, and visually clear adjustment

Consistent output format—ready for use in any downstream node or workflow


**⚙️ Basic Usage**

In ComfyUI, connect the upstream node’s STRING output to this node’s prompts input.

Click “Load Prompts” to automatically generate sliders for each keyword.

Drag the sliders to set weights (range 0.0–2.0, step 0.1, one decimal place).

Use the node’s output, for example:

(one:1.2),(two:0.8),(three:1.0)


**🔌 Inputs & Outputs**

Input

prompts (STRING): A string of prompts separated by commas or line breaks.

Output

output (STRING): A standardized comma-separated string in the format (prompt:value).


**📝 Notes**

After connecting the prompt string input, click “Load Prompts” to generate control sliders.

Slider range: 0.0–2.0.

Tip: Values above 1.6 are usually too strong and may cause severe image distortion.




**[Sample Workflow](https://github.com/OldwonZZ/ComfyUI-Prompt-Weight-slider/blob/main/Prompt%20Slider%20Workflow%20Sample.json)**


![screenshot](https://github.com/OldwonZZ/ComfyUI-Prompt-Weight-slider/blob/main/Screenshot.png)


**Prompt Weight Slider中文**

*注意：这是一个适配SDXL或SD1.5系列的模块，模型需要支持(happy:1.2)这样的提示词格式，
一个用于 ComfyUI 的“提示词权重滑块”节点，让你像调节音频EQ一样快速调节关键词权重，帮助你为一组提示词（prompts）快速设置强度权重，并输出统一格式的字符串供下游节点使用。

**🌟 能干啥**
- 一次性批量管理多个提示词的权重，直观、快速
- 统一输出格式，便于接入任意下游节点或工作流


**⚙️  基本使用**
1. 在 ComfyUI 中将上游的 `STRING` 输出连接到本节点的 `prompts` 输入。
2. 点击 “Load Prompts” 按钮，自动生成滑块。
3. 拖动滑块设置权重，范围 0.0–2.0（步进 0.1，显示一位小数）。
4. 使用本节点的 `output` 输出（示例：`(one:1.2),(two:0.8),(three:1.0)`）。

**🔌 输入与输出**
- 输入
  - `prompts`（STRING）：提示词字符串，逗号或换行分隔。
- 输出
  - `output`（STRING）：标准格式 `(prompt:value)` 的逗号分隔字符串。

**📝使用说明**
- 前端链接string输入prompts之后点击loadprompts生成控制滑块，
- 滑块范围：0.0–2.0, 1.6以上数值会过大，容易产生严重变形，


**Have Fun.**



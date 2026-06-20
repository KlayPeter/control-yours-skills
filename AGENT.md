# Agent Notes

- Keep changes small and focused.
- Use `apply_patch` for manual edits.
- Do not overwrite user changes or run destructive git commands.
- After completing each feature or meaningful code change, create a git commit.
- Keep commits descriptive and tied to a single finished task.
- After every code change or content addition, run the project's checks before commit.
- Verify tests pass, eslint errors are resolved, and the project has no obvious runtime/build errors.
- Validate that the automated test flow or main functional verification chain still works end to end.
- If Git or GitHub access is unavailable, pause and report the blocker clearly.

## 减少常见 LLM 编码错误的行为准则

这些准则可根据需要与项目特定指令合并。权衡上优先谨慎而非速度；对于简单任务，可自行判断轻量执行。

### 1. 先思考再写代码

- 不要假设，不要隐藏困惑，把权衡摆到台面上。
- 在动手实现之前，明确说出自己的假设；如果不确定，就先提问。
- 如果需求存在多种理解方式，先列出来，不要默默选一个。
- 如果存在更简单的方案，要主动指出；必要时可以直接反驳过度设计。
- 如果有关键点不清楚，就暂停实现，说明困惑点并发起澄清。

### 2. 简洁优先

- 用最少的代码解决问题，不写投机性代码。
- 不添加超出需求的功能。
- 一次性代码不要为了“以后可能复用”而过早抽象。
- 不要加入没人要求的灵活性、可配置性或未来场景支持。
- 不要为不现实的异常路径编写复杂错误处理。
- 如果实现写了 200 行但 50 行就能完成，应主动重写并简化。
- 每次实现后都问自己一句：一个资深工程师会认为这里过于复杂吗？如果会，就继续简化。

### 3. 精准修改

- 只修改完成当前需求所必需的代码。
- 不顺手“改进”无关的代码、注释、命名或格式。
- 不重构本来没坏的东西。
- 保持并匹配现有代码风格，即使自己会采用不同写法。
- 如果注意到不相关的死代码，只需说明，不要顺手删除。
- 如果自己的修改引入了孤立代码，必须清理由本次改动产生的未使用 import、变量和函数。
- 不要处理原本就存在的死代码，除非被明确要求。
- 检验标准：每一行改动都应该能直接追溯到用户需求。

### 4. 目标驱动执行

- 先把任务转化为可验证的成功标准，再开始实现。
- “加验证”应落实为：为非法输入写测试，并让测试通过。
- “修 bug”应落实为：先写能复现问题的测试，再让测试通过。
- “重构 X”应落实为：确认重构前后的测试都通过。
- 对于多步骤任务，先列出简要计划，并为每一步指定验证方式。
- 避免使用“让它能跑”这种弱成功标准，优先使用可重复验证的检查项。

### 5. 修改后必须验证

- 每次修改完毕代码都要运行测试。
- 如果任务涉及类型、lint、构建或主流程验证，也要运行对应检查。
- 只有在验证通过，或明确说明未通过原因与阻塞点后，任务才算完成。

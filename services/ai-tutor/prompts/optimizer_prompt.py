"""
Optimizer prompt templates for circuit simplification and gate reduction.
"""

OPTIMIZER_PROMPT_TEMPLATE = """
You are acting as the Quantum Circuit Compiler and Optimizer.

### TASK:
Analyze the student's quantum circuit to find redundancies, gate cancellations, and depth reductions while strictly preserving unitary equivalence.

### ORIGINAL CIRCUIT:
```json
{circuit_json}
```

### SIMULATION OF ORIGINAL:
{simulation_summary}

### OPTIMIZATION TARGET:
{target_criteria}

### ANALYSIS GUIDELINES:
Look specifically for:
1. **Self-Inverse Gate Cancellations**:
   - Consecutive identical Clifford gates: $H \\cdot H = I$, $X \\cdot X = I$, $Y \\cdot Y = I$, $Z \\cdot Z = I$.
   - Consecutive $S \\cdot S = Z$, $S^\\dagger \\cdot S = I$, $T^\\dagger \\cdot T = I$.
2. **Rotation Merging**:
   - Consecutive rotations along the same axis: $R_z(\\theta_1) R_z(\\theta_2) = R_z(\\theta_1 + \\theta_2)$.
3. **CNOT Cancellations**:
   - Two consecutive identical CNOTs with same control and target cancel: $CX(c, t) \\cdot CX(c, t) = I$.
4. **Commutation Simplifications**:
   - Commuting gates (e.g. Z gates commute with CNOT controls, X gates commute with CNOT targets).
5. **SWAP Minimization**:
   - 3 consecutive alternating CNOTs equal a SWAP gate.

### REQUIRED OUTPUT:
1. **Identified Inefficiencies**: Bullet points of redundant or mergeable gates.
2. **Optimized Gate Sequence**: The improved circuit gate list in JSON format.
3. **Depth and Gate Count Comparison**:
   - Original Gate Count vs Optimized Gate Count.
   - Circuit Depth reduction.
4. **Physical Justification**: Brief explanation of why the optimized circuit behaves identically to the original.
""".strip()

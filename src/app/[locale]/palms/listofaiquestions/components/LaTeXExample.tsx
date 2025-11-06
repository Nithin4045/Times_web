"use client";

import React, { useState } from "react";
import { Card, Button, Space } from "antd";
import LaTeXRenderer from "@/components/LaTeXRenderer/LaTeXRenderer";
import LaTeXEditor from "@/components/LaTeXEditor/LaTeXEditor";

/**
 * Example component demonstrating LaTeX rendering and editing
 * This shows how to use LaTeX in questions, options, and solutions
 */
export default function LaTeXExample() {
  const [mathQuestion, setMathQuestion] = useState(
    "Solve for \\(x\\): \\(2x + 3 = 7\\)"
  );
  
  const [complexMath, setComplexMath] = useState(
    "Find the derivative: \\[\\frac{d}{dx}(x^2 + 3x + 5) = 2x + 3\\]"
  );
  
  const [solution, setSolution] = useState(
    `<div class="solution">
      <p class="variable-def">Let \\(x\\) be the unknown value.</p>
      <p class="given-step">Given equation: \\(2x + 3 = 7\\)</p>
      <p class="process-step">Subtracting 3 from both sides: \\(2x = 4\\)</p>
      <p class="process-step">Dividing by 2: \\(x = 2\\)</p>
      <p class="conclusion-step">Therefore, the answer is \\(x = 2\\) (Choice A)</p>
    </div>`
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>LaTeX Integration Examples</h1>
      
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Example 1: Simple Inline Math */}
        <Card title="Example 1: Inline Math" bordered>
          <h3>Question with inline math:</h3>
          <LaTeXRenderer content={mathQuestion} />
          
          <h3 style={{ marginTop: 24 }}>Options:</h3>
          <ul>
            <li><LaTeXRenderer content="\\(x = 1\\)" inline /></li>
            <li><LaTeXRenderer content="\\(x = 2\\)" inline /></li>
            <li><LaTeXRenderer content="\\(x = 3\\)" inline /></li>
            <li><LaTeXRenderer content="\\(x = 4\\)" inline /></li>
          </ul>
        </Card>

        {/* Example 2: Display Math */}
        <Card title="Example 2: Display Math (Centered Equations)" bordered>
          <LaTeXRenderer content={complexMath} />
          
          <h3 style={{ marginTop: 24 }}>Additional equations:</h3>
          <LaTeXRenderer content="\\[\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\\]" />
          <LaTeXRenderer content="\\[E = mc^2\\]" />
        </Card>

        {/* Example 3: Solution with Step-by-Step Math */}
        <Card title="Example 3: Solution with Multiple Steps" bordered>
          <LaTeXRenderer content={solution} />
        </Card>

        {/* Example 4: Mixed Content */}
        <Card title="Example 4: Mixed HTML and Math" bordered>
          <LaTeXRenderer 
            content={`
              <p>Consider the quadratic equation $ax^2 + bx + c = 0$.</p>
              <p>The solutions are given by the quadratic formula:</p>
              <p style="text-align: center;">$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$</p>
              <p>For example, if $a = 1$, $b = -5$, and $c = 6$:</p>
              <p>$$x = \\frac{5 \\pm \\sqrt{25 - 24}}{2} = \\frac{5 \\pm 1}{2}$$</p>
              <p>Therefore, $x = 3$ or $x = 2$</p>
            `}
          />
        </Card>

        {/* Example 5: Editing (Optional) */}
        <Card title="Example 5: LaTeX Editor (Try Editing)" bordered>
          <LaTeXEditor 
            value={mathQuestion}
            onChange={setMathQuestion}
            placeholder="Enter your question with math..."
          />
        </Card>
      </Space>
    </div>
  );
}

import React from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

const PlayConfetti = ({animationDone}) => {
  const { width, height } = useWindowSize()
  return (
    <Confetti
      gravity={0.4}
      run={animationDone}
      numberOfPieces={400}
      width={width}
      height={height}
      drawShape={ctx => {
        ctx.beginPath()
        for(let i = 0; i < 22; i++) {
          const angle = 0.35 * i
          const x = (0.2 + (1.5 * angle)) * Math.cos(angle)
          const y = (0.2 + (1.5 * angle)) * Math.sin(angle)
          ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.closePath()
      }}
    />
  )
};
export default PlayConfetti;

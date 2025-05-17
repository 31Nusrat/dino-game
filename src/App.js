import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const OBSTACLE_TYPES = ["cactus", "doubleCactus", "bird"];

const App = () => {
  const [isJumping, setIsJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dinoBottom, setDinoBottom] = useState(5);
  const [dinoLeft, setDinoLeft] = useState(50);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [scorePop, setScorePop] = useState(false);
  const [bestGlow, setBestGlow] = useState(false);
  const [obstacles, setObstacles] = useState([]);

  const dinoRef = useRef(null);
  const jumpIntervalRef = useRef(null);
  const spawnTimeoutRef = useRef(null);

  const jumpSound = useRef(null);
  const gameOverSound = useRef(null);
  const scoreSound = useRef(null);

  const JUMP_HEIGHT = 150;
  const JUMP_SPEED = 20;
  const FALL_SPEED = 20;

  useEffect(() => {
    const savedBest = localStorage.getItem("bestScore");
    if (savedBest) setBestScore(Number(savedBest));
  }, []);

  // Spawn obstacles
  useEffect(() => {
    if (gameOver) return;

    const spawnObstacle = () => {
      const type =
        OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      const id = Date.now() + Math.random();
      setObstacles((prev) => [...prev, { id, type, left: 600 }]);
      const nextSpawnTime = 1000 + Math.random() * 1500;
      spawnTimeoutRef.current = setTimeout(spawnObstacle, nextSpawnTime);
    };

    spawnObstacle();
    return () => clearTimeout(spawnTimeoutRef.current);
  }, [gameOver]);

  // Move obstacles
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setObstacles((prev) =>
        prev
          .map((obs) => ({ ...obs, left: obs.left - 5 }))
          .filter((obs) => obs.left > -60)
      );
    }, 20);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Handle key press to jump
  useEffect(() => {
    const handleKeyDownorTap = (e) => {
      if (
        (e.code === "Space" || e.code === "ArrowUp" || e.type==="touchstart") &&
        !isJumping &&
        !gameOver
      ) {
        jump();
      }
    };

    document.addEventListener("keydown", handleKeyDownorTap);
    document.addEventListener("touchstart",handleKeyDownorTap);
    return () => {document.removeEventListener("keydown", handleKeyDownorTap);
      document.removeEventListener("touchstart",handleKeyDownorTap);
    }
  }, [isJumping, gameOver]);

  // Jump function
  const jump = () => {
    try {
      jumpSound.current.currentTime = 0;
      jumpSound.current.play().catch(() => {});
    } catch (e) {}

    setIsJumping(true);
    let jumpHeight = 0;

    clearInterval(jumpIntervalRef.current);

    jumpIntervalRef.current = setInterval(() => {
      setDinoBottom((prev) => {
        if (jumpHeight >= JUMP_HEIGHT) {
          clearInterval(jumpIntervalRef.current);
          fall();
          return prev;
        }
        jumpHeight += 10;
        setDinoLeft((prevLeft) => prevLeft + 1);
        return prev + 10;
      });
    }, JUMP_SPEED);
  };

  const fall = () => {
    jumpIntervalRef.current = setInterval(() => {
      setDinoBottom((prev) => {
        if (prev <= 5) {
          clearInterval(jumpIntervalRef.current);
          setIsJumping(false);
          setDinoBottom(5);
          setDinoLeft(50);
          return 5;
        }
        setDinoLeft((prevLeft) => prevLeft - 1);
        return prev - 10;
      });
    }, FALL_SPEED);
  };

  // Game over sound
  useEffect(() => {
    if (gameOver && gameOverSound.current) {
      try {
        gameOverSound.current.currentTime = 0;
        gameOverSound.current.play().catch(() => {});
      } catch (e) {}
    }
  }, [gameOver]);

  // Score sound
  useEffect(() => {
    if (scorePop && scoreSound.current) {
      try {
        scoreSound.current.currentTime = 0;
        scoreSound.current.play().catch(() => {});
      } catch (e) {}
    }
  }, [scorePop]);

  // Collision Detection
  useEffect(() => {
    const interval = setInterval(() => {
      const dino = dinoRef.current;
      if (!dino) return;
      const dinoRect = dino.getBoundingClientRect();

      for (let obs of obstacles) {
        const obsElement = document.querySelector(`[data-id='${obs.id}']`);
        if (!obsElement) continue;

        const obsRect = obsElement.getBoundingClientRect();

        if (
          obsRect.left < dinoRect.right - 10 &&
          obsRect.right > dinoRect.left + 10 &&
          obsRect.top < dinoRect.bottom - 10 &&
          obsRect.bottom > dinoRect.top + 10
        ) {
          setGameOver(true);
          break;
        }
      }
    }, 20);

    return () => clearInterval(interval);
  }, [obstacles, gameOver]);

  // Score and Best Score
  useEffect(() => {
    if (gameOver && score > bestScore) {
      setBestScore(score);
      localStorage.setItem("bestScore", score);
      setBestGlow(true);
    }
  }, [gameOver]);

  useEffect(() => {
    if (bestGlow) {
      const timeout = setTimeout(() => setBestGlow(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [bestGlow]);

  useEffect(() => {
    if (scorePop) {
      const timeout = setTimeout(() => setScorePop(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [scorePop]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setScore((prev) => prev+1);
    
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver]);
  useEffect(()=>{
    if(score>0 && score%100===0)
    {
      setScorePop(true);
      if(scoreSound.current){
        try{
          scoreSound.current.currentTime=0;
          scoreSound.current.play().catch(()=>{});
        }catch(e){}
      }

    }
  },[score])

  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setObstacles([]);
    setDinoBottom(5);
    setIsJumping(false);
  };

  return (
    <div className="game-container">
      <h1>Dino Jump Game</h1>

      {/* 🔊 Sound References */}
      <audio ref={jumpSound} src="/sound/Jump.wav" preload="auto" />
      <audio ref={gameOverSound} src="/sound/GameEnd.wav" preload="auto" />
      <audio ref={scoreSound} src="/sound/CoinSound.wav" preload="auto" />

      {gameOver && (
        <>
          <h2 style={{ color: "red" }}>
            Game Over! Press Restart to play again.
          </h2>
          <button className="restart-button" onClick={handleRestart}>
            Restart
          </button>
        </>
      )}

      <div className="game">
        <div className="score-board">
          <div className={scorePop ? "score-animate" : ""}>Score: {score}</div>
          <div className={`best-score ${bestGlow ? "best-score-animate" : ""}`}>
            Best: {bestScore}
          </div>
        </div>

        <div
          ref={dinoRef}
          className={`dino ${gameOver ? "dead" : ""} ${
            isJumping ? "jumping" : ""
          }`}
          style={{ bottom: `${dinoBottom}px`, left: `${dinoLeft}px` }}
        />

        {obstacles.map((obs) => (
          <div
            key={obs.id}
            data-id={obs.id}
            className={`obstacle ${obs.type}`}
            style={{ left: obs.left }}
          />
        ))}
      </div>
    </div>
  );
};

export default App;

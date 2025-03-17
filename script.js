// Function to calculate the angle between three points
function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }
  
  // Initialize MediaPipe Pose
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });
  
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  
  // Initialize video and canvas
  const videoElement = document.createElement('video');
  const canvasElement = document.getElementById('output');
  const canvasCtx = canvasElement.getContext('2d');
  
  // Initialize counters and flags
  let correctExerciseCount = 0;
  let exerciseInProgress = false;
  let framesInCorrectPosition = 0;
  const threshold = 7; // Number of frames to hold the correct position before counting
  
  // Start the camera
  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.play();
  }
  
  // Process each frame
  pose.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
    if (results.poseLandmarks) {
      // Draw landmarks
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
  
      // Extract landmark coordinates
      const landmarks = results.poseLandmarks;
      const leftHip = { x: landmarks[23].x * canvasElement.width, y: landmarks[23].y * canvasElement.height };
      const leftShoulder = { x: landmarks[11].x * canvasElement.width, y: landmarks[11].y * canvasElement.height };
      const leftElbow = { x: landmarks[13].x * canvasElement.width, y: landmarks[13].y * canvasElement.height };
      const rightHip = { x: landmarks[24].x * canvasElement.width, y: landmarks[24].y * canvasElement.height };
      const rightShoulder = { x: landmarks[12].x * canvasElement.width, y: landmarks[12].y * canvasElement.height };
      const rightElbow = { x: landmarks[14].x * canvasElement.width, y: landmarks[14].y * canvasElement.height };
  
      // Calculate angles
      const leftShoulderAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
      const rightShoulderAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
  
      // Provide feedback
      const feedback = [];
      if (leftShoulderAngle < 90 || rightShoulderAngle < 90) {
        feedback.push("Raise your hand");
      }
  
      // Check if user is in a correct posture for a sustained period
      if (feedback.length === 0) {
        framesInCorrectPosition++;
        if (framesInCorrectPosition >= threshold && !exerciseInProgress) {
          correctExerciseCount++;
          exerciseInProgress = true;
        }
      } else {
        framesInCorrectPosition = 0;
        exerciseInProgress = false;
      }
  
      // Display the correct exercise count
      canvasCtx.fillStyle = '#00FF00';
      canvasCtx.font = '20px Arial';
      canvasCtx.fillText(`Correct: ${correctExerciseCount}`, 20, 50);
  
      // Display feedback
      feedback.forEach((line, i) => {
        canvasCtx.fillStyle = '#FF0000';
        canvasCtx.fillText(line, 20, 100 + (i * 40));
      });
  
      // Display angles
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.fillText(Math.round(leftShoulderAngle), leftShoulder.x, leftShoulder.y);
      canvasCtx.fillText(Math.round(rightShoulderAngle), rightShoulder.x, rightShoulder.y);
    }
  
    canvasCtx.restore();
  });
  
  // Start the camera and process frames
  
startCamera().then(() => {
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await pose.send({ image: videoElement });
      },
      width: 320, // Match canvas width
      height: 600, // Match canvas height
    });
    camera.start();
  });
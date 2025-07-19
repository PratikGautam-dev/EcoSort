import React, { useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const CATEGORY_LABELS = [
  'Recyclable',
  'Non-Recyclable',
  'E-Waste',
  'Compostable',
  'Hazardous',
  'Sellable',
  'Donate-worthy'
];

const CombinedDetectClassify: React.FC = () => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [detectionScore, setDetectionScore] = useState<number | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const [loadingDetect, setLoadingDetect] = useState(false);
  const [loadingClassify, setLoadingClassify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageFileRef = useRef<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageURL(URL.createObjectURL(e.target.files[0]));
      imageFileRef.current = e.target.files[0];
      setDetected(null);
      setDetectionScore(null);
      setClassification(null);
      setError(null);
    }
  };

  const handleDetect = async () => {
    setLoadingDetect(true);
    setDetected(null);
    setDetectionScore(null);
    setClassification(null);
    setError(null);
    const model = await cocoSsd.load();
    if (imageRef.current) {
      const predictions = await model.detect(imageRef.current);
      if (predictions.length > 0) {
        setDetected(predictions[0].class);
        setDetectionScore(predictions[0].score);
      } else {
        setDetected('No object detected');
      }
    }
    setLoadingDetect(false);
  };

  const handleClassify = async () => {
    if (!detected) return;
    setLoadingClassify(true);
    setClassification(null);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: detected })
      });
      if (!response.ok) throw new Error('Classification failed');
      const data = await response.json();
      setClassification(data.classification || 'Unknown');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error occurred');
      }
    } finally {
      setLoadingClassify(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Detect and Classify Object</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {imageURL && (
        <div>
          <img
            ref={imageRef}
            src={imageURL}
            alt="Upload Preview"
            style={{ maxWidth: '100%', marginTop: 16 }}
          />
          <button onClick={handleDetect} disabled={loadingDetect} style={{ marginTop: 16 }}>
            {loadingDetect ? 'Detecting...' : 'Detect Objects'}
          </button>
        </div>
      )}
      {detected && (
        <div style={{ marginTop: 24 }}>
          <h3>Detected Object:</h3>
          <div>
            {detected} {detectionScore !== null && `(${Math.round(detectionScore * 100)}%)`}
          </div>
          <button onClick={handleClassify} disabled={loadingClassify} style={{ marginTop: 16 }}>
            {loadingClassify ? 'Classifying...' : 'Classify Object'}
          </button>
        </div>
      )}
      {classification && (
        <div style={{ marginTop: 24 }}>
          <h3>Classification Result:</h3>
          <div style={{ fontWeight: 'bold', fontSize: 24 }}>{classification}</div>
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 16 }}>{error}</div>
      )}
    </div>
  );
};

export default CombinedDetectClassify;

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';

const DecisionResult = ({ result, onReset }) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const getEmoji = () => {
    const emojis = ['🎉', '✨', '🎊', '🌟', '💫', '🎯', '🏆', '⭐'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  return (
    <div className="mt-4">
      <Alert variant="success" className="text-center">
        {showAnimation && (
          <div className="mb-2" style={{ fontSize: '3rem', animation: 'bounce 0.5s ease' }}>
            {getEmoji()}
          </div>
        )}
        <h3 className="mt-2">The decision is made!</h3>
        <div 
          className="my-3 p-3 bg-white text-dark rounded"
          style={{ 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            animation: showAnimation ? 'fadeIn 0.5s ease' : 'none'
          }}
        >
          {result.chosenOption.text}
        </div>
        <p className="text-muted mb-0">
          Chosen from {result.allOptions.length} options
        </p>
      </Alert>

      {result.adjustedWeights && (
        <Card className="mt-3">
          <Card.Header>
            <strong>📊 Option Weights</strong>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Original Weight</th>
                    <th>Adjusted Weight</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {result.allOptions.map((opt, index) => {
                    const adjusted = result.adjustedWeights[index];
                    const isChosen = opt.id === result.chosenOption.id;
                    return (
                      <tr key={index} className={isChosen ? 'table-success' : ''}>
                        <td>
                          {opt.text}
                          {isChosen && ' ✓'}
                        </td>
                        <td>{opt.weight}</td>
                        <td>{adjusted.adjustedWeight.toFixed(2)}</td>
                        <td>
                          <div className="progress" style={{ height: '20px', minWidth: '100px' }}>
                            <div
                              className="progress-bar bg-primary"
                              style={{ 
                                width: `${(adjusted.adjustedWeight / Math.max(...result.adjustedWeights.map(w => w.adjustedWeight))) * 100}%`
                              }}
                            >
                              {((adjusted.adjustedWeight / result.adjustedWeights.reduce((sum, w) => sum + w.adjustedWeight, 0)) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      <div className="text-center mt-3">
        <Button variant="light" onClick={onReset}>
          🔄 Make Another Decision
        </Button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default DecisionResult;

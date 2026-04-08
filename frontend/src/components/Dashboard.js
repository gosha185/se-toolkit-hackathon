import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import api from '../services/api';
import DecisionResult from './DecisionResult';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([
    { text: '', weight: 1 },
    { text: '', weight: 1 }
  ]);
  const [useHistoryAwareness, setUseHistoryAwareness] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const addOption = () => {
    setOptions([...options, { text: '', weight: 1 }]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = field === 'weight' ? parseFloat(value) || 0 : value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const validOptions = options.filter(opt => opt.text.trim());
    
    if (!query.trim()) {
      setError('Please enter a decision query');
      return;
    }

    if (validOptions.length < 2) {
      setError('Please add at least 2 options');
      return;
    }

    setLoading(true);
    try {
      const decisionResult = await api.makeDecision(
        query.trim(),
        validOptions.map(opt => ({ text: opt.text.trim(), weight: opt.weight })),
        useHistoryAwareness
      );

      if (decisionResult.error) {
        setError(decisionResult.error);
      } else {
        setResult(decisionResult);
      }
    } catch (err) {
      setError('Failed to make decision. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">🎲 Make a Decision</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">What do you need to decide?</Form.Label>
                  <Form.Control
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., What should I eat for dinner?"
                    className="form-control-lg"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="fw-bold mb-0">Options</Form.Label>
                    <Badge bg="info">Add weights to change chances</Badge>
                  </div>
                  
                  {options.map((option, index) => (
                    <div key={index} className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-grow-1"
                      />
                      <Form.Control
                        type="number"
                        value={option.weight}
                        onChange={(e) => updateOption(index, 'weight', e.target.value)}
                        placeholder="Weight"
                        style={{ width: '100px' }}
                        min="0"
                        step="0.1"
                      />
                      {options.length > 2 && (
                        <Button
                          variant="outline-danger"
                          onClick={() => removeOption(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="outline-primary"
                    onClick={addOption}
                    size="sm"
                    className="mt-2"
                  >
                    + Add Option
                  </Button>
                </Form.Group>

                <Form.Check
                  type="switch"
                  id="history-awareness"
                  label="Use history to vary decisions (avoid repeating same choices)"
                  checked={useHistoryAwareness}
                  onChange={(e) => setUseHistoryAwareness(e.target.checked)}
                  className="mb-4"
                />

                {error && <Alert variant="danger">{error}</Alert>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Making decision...' : '🎲 Decide for Me!'}
                </Button>
              </Form>

              {result && <DecisionResult result={result} onReset={() => setResult(null)} />}
            </Card.Body>
          </Card>

          <div className="text-center mt-3">
            <small className="text-white">
              💡 Tip: Higher weight = more likely to be chosen. History awareness reduces repetition.
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

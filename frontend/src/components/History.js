import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button, Spinner } from 'react-bootstrap';
import api from '../services/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadHistory = async (search = '', pageOffset = 0) => {
    setLoading(true);
    try {
      const data = await api.getHistory(limit, pageOffset, search || null);
      setHistory(data.history);
      setTotal(data.total);
      setOffset(pageOffset);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadHistory(searchQuery, 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">📊 Decision History</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSearch} className="mb-4">
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your decisions..."
                    className="flex-grow-1"
                  />
                  <Button variant="primary" type="submit">
                    Search
                  </Button>
                  {searchQuery && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => {
                        setSearchQuery('');
                        loadHistory();
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </Form>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-5">
                  <h5 className="text-muted">No decisions yet</h5>
                  <p className="text-muted">Start making decisions to see your history here!</p>
                </div>
              ) : (
                <>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Query</th>
                        <th>Chosen Option</th>
                        <th>Options Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <small>{formatDate(item.created_at)}</small>
                          </td>
                          <td>
                            <strong>{item.query_text}</strong>
                          </td>
                          <td>
                            <Badge bg="success">{item.chosen_option}</Badge>
                          </td>
                          <td>
                            <Badge bg="info">{item.total_options}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      Showing {history.length} of {total} decisions
                    </small>
                    <div>
                      {offset > 0 && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => loadHistory(searchQuery, offset - limit)}
                        >
                          ← Previous
                        </Button>
                      )}
                      {offset + limit < total && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => loadHistory(searchQuery, offset + limit)}
                        >
                          Next →
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default History;

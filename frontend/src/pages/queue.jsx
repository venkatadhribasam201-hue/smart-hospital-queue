import { useEffect, useState } from "react";
import { getQueue } from "../services/api";
import "./Queue.css";

function Queue() {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQueue = async () => {
    try {
      setLoading(true);

      const data = await getQueue();

      if (data && data.length > 0) {
        const patientQueue = data.filter((item) => item.patient_id === 1);

        if (patientQueue.length > 0) {
          setQueue(patientQueue[patientQueue.length - 1]);
        } else {
          setQueue(null);
        }
      } else {
        setQueue(null);
      }

      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  if (loading) {
    return (
      <div className="queue-page">
        <h2>Loading Queue...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-page">
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="queue-page">
      <div className="queue-container">
        <h1>🏥 Smart Hospital</h1>

        <p className="subtitle">Patient Queue Dashboard</p>

        {queue ? (
          <div className="queue-card">
            <p className="token-label">Your Token Number</p>

            <h2 className="token-number">#{queue.token_number}</h2>

            <div className="status">{queue.status.toUpperCase()}</div>

            <div className="info-container">
              {/* Waiting Time */}
              <div className="info-box">
                <p>⏱️ Waiting Time</p>

                <strong>{queue.estimated_waiting_time} minutes</strong>
              </div>

              {/* Patients Ahead */}
              <div className="info-box">
                <p>👥 Patients Ahead</p>

                <strong>{queue.patients_ahead ?? 0}</strong>
              </div>

              {/* Queue Date */}
              <div className="info-box">
                <p>📅 Queue Date</p>

                <strong>{queue.queue_date.split("T")[0]}</strong>
              </div>
            </div>

            <button className="refresh-button" onClick={loadQueue}>
              🔄 Refresh Queue
            </button>
          </div>
        ) : (
          <div className="queue-card">
            <h2>No Queue Found</h2>

            <p>You don't have an active queue token.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Queue;

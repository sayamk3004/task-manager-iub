import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({ title: '', description: '', image: null });
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (authToken) {
      axios.get('http://localhost:3001/tasks', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((response) => setTasks(response.data))
        .catch((error) => console.error('Error fetching tasks:', error));
    }
  }, [authToken]);
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', task.title);
    formData.append('description', task.description);
    if (task.image) formData.append('image', task.image);

    axios.post('http://localhost:3001/tasks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then((response) => setTasks([...tasks, response.data]))
      .catch((error) => console.error('Error creating task:', error));
  };

  return (
    <div className="App">
      <h1>Task Manager</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task title"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
        />
        <textarea
          placeholder="Task description"
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
        ></textarea>
        <input
          type="file"
          onChange={(e) => setTask({ ...task, image: e.target.files[0] })}
        />
        <button type="submit">Create Task</button>
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            {task.image_url && <img src={`http://localhost:3001${task.image_url}`} alt={task.title} width="100" />}
            <button onClick={() => { /* Update or delete task functionality */ }}>Update/Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

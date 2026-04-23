import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Search, Plus, LogOut, CheckCircle, Trash2 } from 'lucide-react';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [grievances, setGrievances] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  
  const API_URL = 'http://localhost:5000/api/grievances';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGrievances();
  }, [user, navigate]);

  const fetchGrievances = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(API_URL, config);
      setGrievances(res.data);
    } catch (err) {
      console.error('Error fetching grievances', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      fetchGrievances();
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/search?title=${searchQuery}`, config);
      setGrievances(res.data);
    } catch (err) {
      console.error('Error searching', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const newGrievance = { title, description, category };
      await axios.post(API_URL, newGrievance, config);
      
      setTitle('');
      setDescription('');
      setCategory('Academic');
      fetchGrievances(); // Refresh list
    } catch (err) {
      console.error('Error submitting grievance', err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this grievance?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/${id}`, config);
      setGrievances(grievances.filter((g) => g._id !== id));
    } catch (err) {
      console.error('Error deleting grievance', err);
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(`${API_URL}/${id}`, { status: newStatus }, config);
      setGrievances(grievances.map((g) => (g._id === id ? res.data : g)));
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Student Grievances</h1>
          <p>Welcome, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary btn-small" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="dashboard-content">
        {/* Left Side: Form */}
        <div className="card h-fit">
          <h2 className="card-title">Submit a Grievance</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                placeholder="Brief title of the issue"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
              >
                <option value="Academic">Academic</option>
                <option value="Hostel">Hostel</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                rows="4"
                placeholder="Detailed description..."
                required
              ></textarea>
            </div>
            <button type="submit" className="btn" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}>
              <Plus size={18} /> Submit
            </button>
          </form>
        </div>

        {/* Right Side: List and Search */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <form onSubmit={handleSearch} className="search-bar" style={{margin: 0}}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                placeholder="Search grievances by title..."
              />
              <button type="submit" className="btn btn-small" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={18} /> Search
              </button>
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); fetchGrievances(); }} className="btn btn-secondary btn-small">
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="grievance-list">
            {grievances.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No grievances found.</p>
            ) : (
              grievances.map((g) => (
                <div key={g._id} className="grievance-item">
                  <div className="grievance-header">
                    <h3 className="grievance-title">{g.title}</h3>
                    <span className={`grievance-status status-${g.status.toLowerCase()}`}>
                      {g.status}
                    </span>
                  </div>
                  <div className="grievance-category">Category: {g.category} • Date: {new Date(g.date).toLocaleDateString()}</div>
                  <p className="grievance-desc">{g.description}</p>
                  <div className="grievance-actions">
                    <button
                      onClick={() => handleStatusUpdate(g._id, g.status)}
                      className="btn-icon"
                      title={g.status === 'Pending' ? 'Mark Resolved' : 'Mark Pending'}
                    >
                      <CheckCircle size={20} color={g.status === 'Resolved' ? 'var(--success-color)' : 'currentColor'} />
                    </button>
                    <button
                      onClick={() => handleDelete(g._id)}
                      className="btn-icon delete"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

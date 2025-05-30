body {
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #232526, #414345);
  color: #fff;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.app {
  background: rgba(0,0,0,0.6);
  border-radius: 10px;
  padding: 20px;
  width: 300px;
  text-align: center;
  position: relative;
}

h1 {
  margin-top: 0;
}

button {
  background: #ff9800;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  margin: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #e65100;
}

.balance {
  margin: 10px 0;
  font-size: 18px;
}

.nav {
  display: flex;
  justify-content: space-between;
}

.screen {
  display: none;
}

.screen.active {
  display: block;
}

.upgrade {
  background: #333;
  margin: 5px 0;
  padding: 5px;
  border-radius: 5px;
}

.upgrade button {
  margin-left: 10px;
}

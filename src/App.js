import logo from './logo.svg';
import './App.css';

class Car{
  constructor(name) {
    this.brand = name;
  }
}

const myCar = new Car("lotus");
document.write(myCar.brand);

function App() {
  return (
    <div className="App">
      <h1>Testing</h1>
    </div>
  );
}

export default App;

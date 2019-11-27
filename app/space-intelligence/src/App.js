import React from 'react';
import logo from './logo.svg';
import './App.css';
import Builder from './Builder';
import $ from 'jquery';

class App extends React.Component{
  componentDidMount(){
    
    document.addEventListener('DOMContentLoaded',this.initialiseApp);
    
  }
  initialiseApp = () => {
    console.log('loaded',window.app)
  }
  render(){
    return <div></div>
  }
}

export default App;

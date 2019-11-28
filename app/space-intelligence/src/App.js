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
    console.log('componentLoaded',window.app)
    window.app.initialized()
        .then(function(_client) {
          let client = _client;
          client.instance.context()
            .then(function(context){
              console.log(context)
            }).catch(function(error) {
              console.log(error)
            });
        })
  }
  render(){
    return <div>This s Modal Popup</div>
  }
}

export default App;

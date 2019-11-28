import React from 'react';
import logo from './logo.svg';
import './App.css';
import Builder from './Builder';
import $ from 'jquery';

class App extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      context : {},
      client: {},
      clientLoaded: false
    }
  }
  componentDidMount(){
    document.addEventListener('DOMContentLoaded',this.initialiseApp);
    
  }
  initialiseApp = () => {
    console.log('componentLoaded',window.app)
    window.app.initialized()
        .then((_client) => {
          let client = _client;
          this.setState({client: client});
          client.instance.context()
            .then((context) => {
              this.setState({context: context, clientLoaded: true})
              console.log(context)
            }).catch(function(error) {
              console.log(error)
            });
        })
  }
  render(){
    const {context, client, clientLoaded} = this.state;
    const params = {
      context,
      client
    }
    if(clientLoaded)
      return <Builder params={params}/>
    else return ''
  }
}

export default App;

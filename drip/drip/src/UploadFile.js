import React from 'react';
import './upload.css';
import axios from 'axios';



class UploadFile extends React.Component {
	
	constructor(props) {
		super(props);
		this.state = {file: '', msg: ''};
	}
	
	onFileChange = (event) => {
		this.setState({
			file: event.target.files[0]
		});
		console.log(event.target.files);
	}
	files
	uploadFileData = (event) => {
		// event.preventDefault();
		// this.setState({msg: ''});
		// let formdata = new FormData();
		// try {
		// 	const response = axios({
		// 	  method: "post",
		// 	  url: 'http://localhost:8080/upload',
		// 	  data: formdata,
		// 	  headers: { "Content-Type": "multipart/form-data" },
		// 	});
		//   } catch(error) {
		// 	console.log(error)
		//   }


		  axios.post("http://localhost:8080/upload", "hello").then( res => {
			  console.log(res.data);
		  }
		  );
	}
	
	render() {
		return (
			<div id="container">
				<h1>File Upload Example using React</h1>
				<h3>Upload a File</h3>
				<h4>{this.state.msg}</h4>
				<input onChange={this.onFileChange} type="file"></input>
				<button disabled={!this.state.file} onClick={this.uploadFileData}>Upload</button>
			</div>
		)
	}

}

export default UploadFile;
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from "react-router-dom";
// import { Provider } from 'react-redux';
import reportWebVitals from './reportWebVitals';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { WalletModalProvider } from "./context/WalletModalContext";
import ContextProvider from './context';
// import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import './index.scss';
import './responsive.scss';
// 
function getLibrary(provider: any) {
	const library = new Web3Provider(provider);
	library.pollingInterval = 12000;
	return library;
}
ReactDOM.render(
	// <Provider store={store}>
	<React.StrictMode>
		<ContextProvider>
			<BrowserRouter>
				<Web3ReactProvider getLibrary={getLibrary}>
					<WalletModalProvider>
						<App />
					</WalletModalProvider>
				</Web3ReactProvider>
			</BrowserRouter>
		</ContextProvider>
	</React.StrictMode>,
	// </Provider>,
	document.getElementById('root')
);

reportWebVitals();

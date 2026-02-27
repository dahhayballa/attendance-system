import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Router from './Router';
import { ToastContainer } from '../shared/hooks/useToast';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Router />
                <ToastContainer />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

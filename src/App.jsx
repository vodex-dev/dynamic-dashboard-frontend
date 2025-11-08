import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DynamicDashboard from './pages/DynamicDashboard';
import PagesManager from './pages/Admin/PagesManager';
import FieldsManager from './pages/Admin/FieldsManager';
import SectionsManager from './pages/Admin/SectionsManager';
import UsersManager from './pages/Admin/UsersManager';
import Collections from './pages/Admin/Collections';
import CollectionItems from './pages/Admin/CollectionItems';
import Overview from './pages/User/Overview';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const UserLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/dynamic" element={<DynamicDashboard />} />
              <Route path="/admin/pages" element={<PagesManager />} />
              <Route path="/admin/fields" element={<FieldsManager />} />
              <Route path="/admin/sections" element={<SectionsManager />} />
              <Route path="/admin/users" element={<UsersManager />} />
              <Route path="/admin/collections" element={<Collections />} />
              <Route path="/admin/collection-items" element={<CollectionItems />} />
            </Route>
          </Route>

          {/* Protected User routes */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route element={<UserLayout />}>
              <Route path="/user/overview" element={<Overview />} />
              <Route path="/user/dynamic" element={<DynamicDashboard />} />
              <Route path="/user/collections" element={<Collections />} />
              <Route path="/user/collection-items" element={<CollectionItems />} />
            </Route>
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BrowserRouter>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;

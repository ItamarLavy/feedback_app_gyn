/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import PendingAccess from './pages/PendingAccess';
import ExpertFeedbackDetail from './pages/ExpertFeedbackDetail';
import ExpertFeedbackDetailWithAuth from './pages/ExpertFeedbackDetailWithAuth';
import ExpertPasswords from './pages/ExpertPasswords';
import Experts from './pages/Experts';
import Home from './pages/Home';
import Instructions from './pages/Instructions';
import InternDetails from './pages/InternDetails';
import InternPasswords from './pages/InternPasswords';
import InternProfile from './pages/InternProfile';
import Interns from './pages/Interns';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "PendingAccess": PendingAccess,
    "ExpertFeedbackDetail": ExpertFeedbackDetail,
    "ExpertFeedbackDetailWithAuth": ExpertFeedbackDetailWithAuth,
    "ExpertPasswords": ExpertPasswords,
    "Experts": Experts,
    "Home": Home,
    "Instructions": Instructions,
    "InternDetails": InternDetails,
    "InternPasswords": InternPasswords,
    "InternProfile": InternProfile,
    "Interns": Interns,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
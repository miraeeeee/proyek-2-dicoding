import AboutPage from '../pages/about/about-page';
import RegisterPage from '../pages/register/register-page';
import LoginPage from '../pages/login/login-page';
import StoriesPage from '../pages/stories/stories-page'; 
import AddStoryPage from '../pages/add-story/add-story-page';
import DetailStoryPage from '../pages/detail/detail-story-page';
import FavoritesPage from '../pages/favorites/favorites-page';

const routes = {
  '/': new StoriesPage(),
  '/about': new AboutPage(),
  '/register': new RegisterPage(),
  '/login': new LoginPage(),
  '/add-story': new AddStoryPage(),
  '/detail/:id': new DetailStoryPage(),
  '/favorites': new FavoritesPage()
};

export default routes;

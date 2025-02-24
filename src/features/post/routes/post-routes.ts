import { Router } from 'express';
import { Create } from '@post/controllers/create-post';
class PostRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  public routes(): Router {
    this.router.post('/post', Create.prototype.post);
    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();

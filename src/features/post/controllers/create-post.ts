import { postSchema } from '@post/schemas/post-validator';
import { JoiValidation } from '@root/shared/decorators/joi-validation-decorator';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { StatusCodes } from 'http-status-codes';
import { IPostDocument } from '@post/interfaces/post-interface';
import { PostCache } from '@root/services/redis/post.cache';

const postCache: PostCache = new PostCache();
export class Create {
  @JoiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;
    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as IPostDocument;
    await postCache.savePostToCache({
      key: postObjectId.toString(),
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId,
      createdPost
    });
    // socketIOPostObject.emit('add post', createdPost);

    res.status(StatusCodes.CREATED).json({ message: 'Post created' });
  }
}

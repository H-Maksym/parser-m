// logical flags
import { IS_AWS, IS_DOCKER, IS_RENDER, IS_VERCEL } from './index';

export const IS_REMOTE = !!IS_AWS || !!IS_VERCEL || !!IS_DOCKER || !!IS_RENDER;

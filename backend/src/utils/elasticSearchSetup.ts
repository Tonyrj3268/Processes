import client from '@src/config/elasticsearch';
import { Post } from '@src/models/post';
import { IUserDocument } from '@src/models/user';

export async function setupElasticsearch() {
    try {
        // 檢查索引是否存在，不存在則創建
        const indexExists = await client.indices.exists({
            index: 'posts'
        });

        if (!indexExists) {
            // 創建貼文索引
            await client.indices.create({
                index: 'posts',
                mappings: {
                    properties: {
                        content: {
                            type: 'text',
                            analyzer: 'standard'
                        },
                        userId: { type: 'keyword' },
                        userName: { type: 'text' },
                        createdAt: { type: 'date' }
                    }
                }
            });
        }

        // 同步現有的貼文到 Elasticsearch
        const posts = await Post.find().populate('user', 'userName');

        // 批量索引文檔
        const operations = posts.flatMap(post => [{
            index: {
                _index: 'posts',
                _id: post._id.toString()
            }
        }, {
            content: post.content,
            userId: post.user._id.toString(),
            userName: (post.user as IUserDocument).userName,
            createdAt: post.createdAt
        }]);

        if (operations.length > 0) {
            await client.bulk({ operations });
        }

        console.log('Elasticsearch setup completed');
    } catch (error) {
        console.error('Elasticsearch setup failed:', error);
    }
}
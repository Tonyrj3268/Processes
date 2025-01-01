// src/types/elasticsearch.ts
import { GetResponse } from '@elastic/elasticsearch/lib/api/types';

export interface SearchHit {
    _index: string;
    _id: string;
    _score: number;
    _source: {
        content?: string;
        userId?: string;
        userName?: string;
        accountName?: string;
        avatarUrl?: string;
        bio?: string;
        isPublic?: boolean;
        likesCount?: number;
        repliesCount?: number;
        followersCount?: number;
        followingCount?: number;
        createdAt?: string;
        updatedAt?: string;
    };
}

export interface SearchBody {
    size: number;
    query: {
        bool: {
            should: Array<{
                multi_match?: {
                    query: string;
                    fields: string[];
                    fuzziness: string;
                };
                match_phrase?: {
                    content: {
                        query: string;
                        boost: number;
                    };
                };
            }>;
            filter?: Array<{
                term: {
                    [key: string]: boolean | string | number;
                };
            }>;
        };
    };
    sort: Array<Record<string, 'desc' | 'asc'>>;
    search_after?: Array<string | number>;
}

export interface SearchRequest {
    index: string;
    body: SearchBody;
}

export interface ElasticGetResponse extends GetResponse {
    _source: {
        content: string;
        userId: string;
        userName: string;
        createdAt: string;
        [key: string]: unknown;
    };
}
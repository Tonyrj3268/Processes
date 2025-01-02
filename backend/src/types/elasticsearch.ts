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
        createdAt?: string;
    };
    highlight?: {
        content?: string[];
    };
}

interface HighlightField {
    type: string;
    fragment_size: number;
    number_of_fragments: number;
    pre_tags: string[];
    post_tags: string[];
}

interface QueryOptions {
    match_phrase?: {
        content: {
            query: string;
            boost?: number;
        };
    };
    match?: {
        content: {
            query: string;
            operator?: string;
            boost?: number;
        };
    };
    term?: {
        'content.raw'?: {
            value: string;
            boost?: number;
        };
    };
}

export interface SearchBody {
    size: number;
    sort?: Array<Record<string, "desc" | "asc">>;
    search_after?: Array<string | number>;
    query: {
        bool: {
            must?: Array<{
                bool?: {
                    should: Array<QueryOptions>;
                    minimum_should_match?: number;
                };
            }>;
            filter?: Array<{
                bool: {
                    should: Array<{
                        term: { [key: string]: string };
                    }>;
                };
            }>;
        };
    };
    highlight?: {
        fields: {
            content: HighlightField;
        };
    };
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
    };
}
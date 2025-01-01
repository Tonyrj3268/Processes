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

interface MatchQuery {
    match: {
        [key: string]: {
            query: string;
            [key: string]: unknown;
        };
    };
}

interface MatchPhraseQuery {
    match_phrase: {
        [key: string]: {
            query: string;
            boost?: number;
        };
    };
}

interface MultiMatchQuery {
    multi_match: {
        query: string;
        fields: string[];
        fuzziness?: string;
        [key: string]: unknown;
    };
}

interface TermQuery {
    term: {
        [key: string]: string | number | boolean;
    };
}

interface BoolQuery {
    bool: {
        must?: Array<MatchQuery | MatchPhraseQuery | MultiMatchQuery | BoolQuery>;
        should?: Array<MatchQuery | MatchPhraseQuery | MultiMatchQuery | TermQuery | BoolQuery>;
        filter?: Array<TermQuery | BoolQuery>;
        [key: string]: unknown;
    };
}

export interface SearchBody {
    size: number;
    query: BoolQuery;
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
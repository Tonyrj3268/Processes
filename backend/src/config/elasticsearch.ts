import { Client } from '@elastic/elasticsearch'

const client = new Client({
    node: 'http://elasticsearch:9200'
})

export default client;
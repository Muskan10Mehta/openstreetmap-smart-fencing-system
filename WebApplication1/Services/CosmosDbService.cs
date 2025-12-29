using WebApplication1.Model;
using Microsoft.Azure.Cosmos;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApplication1.Services
{
    public class CosmosDbService : ICosmosDbService
    {
        private Container _container;

        public CosmosDbService(
            CosmosClient cosmosDbClient,
            string databaseName,
            string containerName)
        {
            _container = cosmosDbClient.GetContainer(databaseName, containerName);
        }

        public async Task AddAsync(Demo item)
        {
            await _container.CreateItemAsync(item, new PartitionKey(item.Id));
        }

        public async Task DeleteAsync(string id)
        {
            await _container.DeleteItemAsync<Demo>(id, new PartitionKey(id));
        }

        public async Task<Demo> GetAsync(string id)
        {
            try
            {
                var response = await _container.ReadItemAsync<Demo>(id, new PartitionKey(id));
                return response.Resource;
            }
            catch (CosmosException) //For handling item not found and other exceptions
            {
                return null;
            }
        }

        public async Task<IEnumerable<Demo>> GetMultipleAsync(string queryString)
        {
            var query = _container.GetItemQueryIterator<Demo>(new QueryDefinition(queryString));

            var results = new List<Demo>();
            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                results.AddRange(response.ToList());
            }

            return results;
        }

        public async Task UpdateAsync(string id, Demo item)
        {
            await _container.UpsertItemAsync(item, new PartitionKey(id));
        }
    }
}

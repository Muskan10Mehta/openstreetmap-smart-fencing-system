using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.Model;

namespace WebApplication1.Services
{
    public class InMemoryDbService : ICosmosDbService
    {
        private readonly ConcurrentDictionary<string, Demo> _items = new();

        public InMemoryDbService()
        {
            // Add some sample data
            var sample1 = new Demo
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Sample Location 1",
                Email = "sample1@example.com",
                Phone = "123-456-7890"
            };
            var sample2 = new Demo
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Sample Location 2",
                Email = "sample2@example.com",
                Phone = "098-765-4321"
            };
            _items[sample1.Id] = sample1;
            _items[sample2.Id] = sample2;
        }

        public async Task AddAsync(Demo item)
        {
            if (string.IsNullOrEmpty(item.Id))
            {
                item.Id = Guid.NewGuid().ToString();
            }
            _items[item.Id] = item;
            await Task.CompletedTask;
        }

        public async Task DeleteAsync(string id)
        {
            _items.TryRemove(id, out _);
            await Task.CompletedTask;
        }

        public async Task<Demo?> GetAsync(string id)
        {
            _items.TryGetValue(id, out var item);
            return await Task.FromResult(item);
        }

        public async Task<IEnumerable<Demo>> GetMultipleAsync(string queryString)
        {
            // Ignore query string, just return all items
            return await Task.FromResult(_items.Values.ToList());
        }

        public async Task UpdateAsync(string id, Demo item)
        {
            item.Id = id;
            _items[id] = item;
            await Task.CompletedTask;
        }
    }
}

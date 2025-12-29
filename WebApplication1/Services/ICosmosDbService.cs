using WebApplication1.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebApplication1.Services
{
    public interface ICosmosDbService
    {
        Task<IEnumerable<Demo>> GetMultipleAsync(string query);
        Task<Demo?> GetAsync(string id);
        Task AddAsync(Demo item);
        Task UpdateAsync(string id, Demo item);
        Task DeleteAsync(string id);
    }
}


using WebApplication1.Model;
using WebApplication1.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase
    {
        private readonly ICosmosDbService _cosmosDbService;

        public ItemsController(ICosmosDbService cosmosDbService)
        {
            _cosmosDbService = cosmosDbService ?? throw new ArgumentNullException(nameof(cosmosDbService));
        }

        // GET api/items
        [HttpGet]
        public async Task<IActionResult> List()
        {
            return Ok(await _cosmosDbService.GetMultipleAsync("SELECT * FROM c"));
        }

        // GET api/items/5
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var item = await _cosmosDbService.GetAsync(id);
            if (item == null)
            {
                return NotFound();
            }
            return Ok(item);
        }

        // POST api/items
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Demo item)
        {
            if (item == null)
            {
                return BadRequest("Item cannot be null");
            }
            
            item.Id = Guid.NewGuid().ToString();
            await _cosmosDbService.AddAsync(item);
            return CreatedAtAction(nameof(Get), new { id = item.Id }, item);
        }

        // PUT api/items/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(string id, [FromBody] Demo item)
        {
            if (item == null || string.IsNullOrEmpty(item.Id))
            {
                return BadRequest("Item or Item.Id cannot be null");
            }
            
            if (id != item.Id)
            {
                return BadRequest("Route id does not match item id");
            }
            
            await _cosmosDbService.UpdateAsync(item.Id, item);
            return NoContent();
        }

        // DELETE api/items/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _cosmosDbService.DeleteAsync(id);
            return NoContent();
        }
    }
}


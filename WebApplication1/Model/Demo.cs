using Newtonsoft.Json;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WebApplication1.Model
{
    public class Demo
    {
        [JsonProperty(PropertyName = "id")]
        public string? Id { get; set; }

        [JsonProperty(PropertyName = "name")]
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string? Name { get; set; }

        [JsonProperty(PropertyName = "email")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string? Email { get; set; }

        [JsonProperty(PropertyName = "phone")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? Phone { get; set; }

        [JsonProperty(PropertyName = "address")]
        public string? Address { get; set; }

        [JsonProperty(PropertyName = "latitude")]
        public double? Latitude { get; set; }

        [JsonProperty(PropertyName = "longitude")]
        public double? Longitude { get; set; }

        [JsonProperty(PropertyName = "fenceCoordinates")]
        public List<GeoPoint>? FenceCoordinates { get; set; }
    }

    public class GeoPoint
    {
        [JsonProperty(PropertyName = "lat")]
        public double Lat { get; set; }

        [JsonProperty(PropertyName = "lng")]
        public double Lng { get; set; }
    }
}


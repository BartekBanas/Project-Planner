using Microsoft.AspNetCore.Mvc;
using ProjectPlanner.Application.Services;
using ProjectPlanner.Infrastructure.TaskObjects;

namespace Project_Planner.Controllers;

[ApiController]
[Route("api/CPM")]
public class CpmController : Controller
{
    private readonly CpmService _cpmService;

    public CpmController(CpmService cpmService)
    {
        _cpmService = cpmService;
    }

    [HttpPost]
    public async Task<IActionResult> PostCpmRequest([FromBody] CpmTask task)
    {
        var solution = await _cpmService.Solve(task);

        return Ok(solution);
    }
}
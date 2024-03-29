﻿using FluentValidation;
using ProjectPlanner.Business.TransportationProblem;

namespace ProjectPlanner.Business.Validation;

public class TpFluentValidator : AbstractValidator<TpTask>
{
    public TpFluentValidator()
    {
        RuleFor(task => task.Suppliers)
            .NotNull().WithMessage("Suppliers cannot be null")
            .Must(suppliers => suppliers.Count > 0).WithMessage("There must be at least one supplier");

        RuleFor(task => task.Recipients)
            .NotNull().WithMessage("Recipients cannot be null")
            .Must(recipients => recipients.Count > 0).WithMessage("There must be at least one recipient");

        RuleFor(task => task.TransportCost)
            .NotNull().WithMessage("Transport Cost cannot be null");

        RuleFor(task => task).Custom(ValidateTasksConsistency);
        RuleFor(task => task.Suppliers).Custom(ValidateSuppliers);
        RuleFor(task => task.Recipients).Custom(ValidateRecipients);
        RuleFor(task => task).Custom(ValidateTransportationCosts);
    }

    private void ValidateSuppliers(List<Supplier> suppliers, ValidationContext<TpTask> context)
    {
        for (int i = 0; i < suppliers.Count; i++)
        {
            if (suppliers[i].Supply <= 0)
            {
                context.AddFailure("Supplier " + (i + 1) + " needs to have supply");
            }

            if (suppliers[i].Cost <= 0)
            {
                context.AddFailure("Supplier " + (i + 1) + " needs to have positive selling cost");
            }
        }
    }

    private void ValidateRecipients(List<Recipient> recipients, ValidationContext<TpTask> context)
    {
        for (int i = 0; i < recipients.Count; i++)
        {
            if (recipients[i].Demand <= 0)
            {
                context.AddFailure("Recipient " + (i + 1) + " needs to have demand");
            }

            if (recipients[i].Cost <= 0)
            {
                context.AddFailure("Recipient " + (i + 1) + " needs to have positive buying cost");
            }
        }
    }

    private void ValidateTransportationCosts(TpTask task, ValidationContext<TpTask> context)
    {
        for (int i = 0; i < task.TransportCost.Length; i++)
        {
            for (int j = 0; j < task.TransportCost[i].Length; j++)
            {
                if (task.TransportCost[i][j] < 0)
                {
                    context.AddFailure("Transportation cost between Supplier " + (i + 1) + " and recipient " + (j + 1) +
                                       " cannot be negative");
                }
            }
        }
    }

    private void ValidateTasksConsistency(TpTask task, ValidationContext<TpTask> context)
    {
        if (task.TransportCost.Length == 0 || task.TransportCost.Any(row => row.Length == 0))
        {
            context.AddFailure("Transportation costs are not assigned to any supplier or recipient");
        }
    
        if (task.TransportCost.GetLength(0) > task.Suppliers.Count)
        {
            context.AddFailure("Transportation costs not assigned to any supplier were found");
        }
        if (task.TransportCost.GetLength(0) < task.Suppliers.Count)
        {
            context.AddFailure("At least one supplier without transportation costs was found");
        }

        if (task.TransportCost.Any(row => row.Length > task.Recipients.Count))
        {
            context.AddFailure("Transportation costs not assigned to any recipient were found");
        }
        if (task.TransportCost.Any(row => row.Length < task.Recipients.Count))
        {
            context.AddFailure("At least one recipient without transportation costs was found");
        }
    }
}
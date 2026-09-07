<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;

class CustomerController extends Controller
{
    public function index()
    {
        return $this->ok(Customer::orderBy('name')->get());
    }

    public function store(StoreCustomerRequest $request)
    {
        $customer = Customer::create($request->validated());

        return $this->ok($customer, 'Customer created.', 201);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $customer->update($request->validated());

        return $this->ok($customer, 'Customer updated.');
    }
}

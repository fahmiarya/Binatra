<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 text-white p-4">
      <slot name="sidebar" />
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="bg-white shadow p-4">
        <slot name="header" />
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-6 bg-gray-100">
        <slot />
      </main>
    </div>
  </div>
</template>

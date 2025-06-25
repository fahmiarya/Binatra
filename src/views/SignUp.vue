<script setup>
import { ref, onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useRouter } from 'vue-router'

const router = useRouter()
const accountStore = useAccountStore()

const formData = ref({
  name: '',
  email: '',
  username: '',
  password: '',
})

// COMPONENT GUARD - Check saat component mounted
onMounted(async () => {
  // Jika belum initialized, check session dulu
  if (!accountStore.initialized) {
    await accountStore.getCurrentUser()
  }

  // Jika sudah login, redirect ke home
  if (accountStore.isAuthenticated) {
    showSuccessToast('Anda sudah login!')
    router.replace('/')
    return
  }
})

const register = async () => {
  if (
    !formData.value.name ||
    !formData.value.email ||
    !formData.value.username ||
    !formData.value.password
  ) {
    showErrToast('Pendaftaran gagal. Semua field harus diisi.')
    return
  }

  try {
    const response = await accountStore.register(formData.value)

    if (response.success) {
      showSuccessToast(response.message || 'Pendaftaran berhasil!')
      // Force redirect
      await router.replace('/')
    } else {
      showErrToast(response.message || 'Pendaftaran gagal.')
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.'
    showErrToast(errorMessage)
  }
}

const showSuccessToast = (msg) => {
  toast.success(msg, { autoClose: 3000, position: 'top-right' })
}

const showErrToast = (msg) => {
  toast.error(msg, { autoClose: 3000, position: 'top-right' })
}

// Initialize authentication saat app start
onMounted(async () => {
  if (!accountStore.initialized) {
    await accountStore.getCurrentUser()
  }
})
</script>


<template>
  <section class="flex flex-col min-h-screen">
    <div class="flex-col flex-1">
      <div
        class="relative flex items-start pt-12 pb-56 m-4 overflow-hidden bg-center bg-cover min-h-50-screen rounded-xl"
        style="background-image: url('../assets/img/curved-images/curved14.jpg')"
      >
        <span
          class="absolute top-0 left-0 w-full h-full bg-center bg-cover bg-gradient-to-br from-slate-700 to-blue-400"
        ></span>
        <div class="container z-10">
          <div class="flex flex-wrap justify-center -mx-3">
            <div
              class="w-full max-w-full px-3 mx-auto mt-0 text-center lg:flex-0 shrink-0 lg:w-5/12"
            >
              <h1 class="mt-12 mb-2 text-white">Selamat Datang!</h1>
              <p class="text-white">
                Jadilah bagian dari solusi pemantauan air kota yang cerdas dengan BINATRA.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="flex flex-wrap -mx-3 -mt-48 md:-mt-56 lg:-mt-48">
          <div
            class="w-full max-w-full px-3 mx-auto mt-0 md:flex-0 shrink-0 md:w-7/12 lg:w-5/12 xl:w-4/12"
          >
            <div
              class="relative z-0 flex flex-col min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border"
            >
              <div class="p-6 mb-0 text-center bg-white border-b-0 rounded-t-2xl">
                <h5>Daftar Sekarang</h5>
              </div>
              <div class="flex-auto p-6">
                <form role="form text-left" @submit.prevent="register">
                  <div class="mb-4">
                    <input
                      type="text"
                      v-model="formData.name"
                      :disabled="accountStore.loading"
                      class="text-sm focus:shadow-soft-primary-outline leading-5.6 ease-soft block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding py-2 px-3 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:bg-white focus:text-gray-700 focus:outline-none focus:transition-shadow disabled:opacity-50"
                      placeholder="Name"
                      aria-label="Name"
                      aria-describedby="name-addon"
                    />
                  </div>
                  <div class="mb-4">
                    <input
                      type="email"
                      v-model="formData.email"
                      :disabled="accountStore.loading"
                      class="text-sm focus:shadow-soft-primary-outline leading-5.6 ease-soft block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding py-2 px-3 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:bg-white focus:text-gray-700 focus:outline-none focus:transition-shadow disabled:opacity-50"
                      placeholder="Email"
                      aria-label="Email"
                      aria-describedby="email-addon"
                    />
                  </div>
                  <div class="mb-4">
                    <input
                      type="text"
                      v-model="formData.username"
                      :disabled="accountStore.loading"
                      class="text-sm focus:shadow-soft-primary-outline leading-5.6 ease-soft block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding py-2 px-3 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:bg-white focus:text-gray-700 focus:outline-none focus:transition-shadow disabled:opacity-50"
                      placeholder="Username"
                      aria-label="Username"
                      aria-describedby="username-addon"
                    />
                  </div>
                  <div class="mb-4">
                    <input
                      type="password"
                      v-model="formData.password"
                      :disabled="accountStore.loading"
                      class="text-sm focus:shadow-soft-primary-outline leading-5.6 ease-soft block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding py-2 px-3 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:bg-white focus:text-gray-700 focus:outline-none focus:transition-shadow disabled:opacity-50"
                      placeholder="Password"
                      aria-label="Password"
                      aria-describedby="password-addon"
                    />
                  </div>
                  <div class="text-center">
                    <button
                      type="submit"
                      :disabled="accountStore.loading"
                      class="inline-block w-full px-6 py-3 mt-6 mb-2 font-bold text-center text-white uppercase align-middle transition-all bg-transparent border-0 rounded-lg cursor-pointer active:opacity-85 hover:scale-102 hover:shadow-soft-xs leading-pro text-xs ease-soft-in tracking-tight-soft shadow-soft-md bg-150 bg-x-25 bg-gradient-to-tl from-gray-900 to-slate-800 hover:border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="accountStore.loading">Loading...</span>
                      <span v-else>Sign up</span>
                    </button>
                  </div>
                  <p class="mt-4 mb-0 leading-normal text-sm">
                    Sudah Punya Akun?
                    <router-link to="/sign-in" class="font-bold text-slate-700">Sign in</router-link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import '@/assets/css/soft-ui-dashboard-tailwind.css';
</style>

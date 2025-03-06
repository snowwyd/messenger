package tests

import (
	"log"
	"math/rand"
	"msgauth/internal/config"
	"msgauth/internal/storage"
	"msgauth/tests/suite"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	msgv1auth "github.com/snowwyd/protos/gen/go/messenger/msgauth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testAppSecret  = "sanyakrut"
	usernameLen    = 6
	passLenValid   = 10
	passLenInvalid = 7
	testValidEmail = "snowwyd@gmail.com"
)

// инициализация базы через утилиту init.go
func TestMain(m *testing.M) {
	os.Setenv("CONFIG_PATH", "../config/local.yaml")

	godotenv.Load("../.env")
	cfg := config.MustLoad()
	cleaner, err := storage.NewTestDBCleaner(cfg.StoragePath, "auth")
	if err != nil {
		log.Fatalf("MongoDB connection error: %v", err)
	}
	defer cleaner.Close()

	if err := cleaner.Cleanup(); err != nil {
		log.Fatalf("Error initializing DB: %v", err)
	}

	code := m.Run()
	os.Exit(code)
}

func TestRegisterLogin_Login_HappyPath(t *testing.T) {
	ctx, st := suite.New(t)

	email := genEmail(testValidEmail)
	pass := genPassword(passLenValid)
	username := genUsername(usernameLen)

	respReg, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    email,
		Password: pass,
		Username: username,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	respLogin, err := st.AuthClient.Login(ctx, &msgv1auth.LoginRequest{
		Email:    email,
		Password: pass,
	})
	require.NoError(t, err)

	loginTime := time.Now()
	token := respLogin.GetToken()

	require.NotEmpty(t, token)

	tokenParsed, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(testAppSecret), nil
	})
	require.NoError(t, err)

	claims, ok := tokenParsed.Claims.(jwt.MapClaims)
	assert.True(t, ok)

	assert.Equal(t, respReg.GetUserId(), claims["uid"].(string))
	assert.Equal(t, email, claims["email"].(string))

	const deltaSeconds = 1
	assert.InDelta(t, loginTime.Add(st.Cfg.TokenTTL).Unix(), claims["exp"].(float64), deltaSeconds)
}

func TestRegister_FailCases(t *testing.T) {
	ctx, st := suite.New(t)

	tests := []struct {
		name        string
		email       string
		username    string
		password    string
		expectedErr string
	}{
		{
			name:        "Register with Empty Password",
			email:       genEmail(testValidEmail),
			password:    "",
			username:    genUsername(usernameLen),
			expectedErr: "password is required",
		},
		{
			name:        "Register with Empty Email",
			email:       "",
			password:    genPassword(passLenValid),
			username:    genUsername(usernameLen),
			expectedErr: "email is required",
		},
		{
			name:        "Register with Both Empty Email and Password",
			email:       "",
			password:    "",
			username:    genUsername(usernameLen),
			expectedErr: "email is required",
		},
		{
			name:        "Register with Empty Username",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenValid),
			username:    "",
			expectedErr: "username is required",
		},
		{
			name:        "Register with non valid Email 1",
			email:       "incorrect email",
			password:    genPassword(passLenValid),
			username:    genUsername(usernameLen),
			expectedErr: "email format must be example@mail.com",
		},
		{
			name:        "Register with non valid Email 2",
			email:       "incorrect email@gmail.com",
			password:    genPassword(passLenValid),
			username:    genUsername(usernameLen),
			expectedErr: "email format must be example@mail.com",
		},
		{
			name:        "Register with non valid Email 3",
			email:       "incorrect_email@gmail..com",
			password:    genPassword(passLenValid),
			username:    genUsername(usernameLen),
			expectedErr: "email format must be example@mail.com",
		},
		{
			name:        "Register with non valid Password 1",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenInvalid),
			username:    genUsername(usernameLen),
			expectedErr: "password must be at least 8 characters long",
		},
		{
			name:        "Register with non valid Password 2",
			email:       genEmail(testValidEmail),
			password:    "invalid password ",
			username:    genUsername(usernameLen),
			expectedErr: "password must be at least 8 characters long",
		},
		{
			name:        "Register with non valid Username 1",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenValid),
			username:    "_aaaa",
			expectedErr: "username must contain only numbers, letters, and underscores (not first symbol)",
		},
		{
			name:        "Register with non valid Username 2",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenValid),
			username:    "aa$aa",
			expectedErr: "username must contain only numbers, letters, and underscores (not first symbol)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
				Email:    tt.email,
				Password: tt.password,
				Username: tt.username,
			})
			require.Error(t, err)
			require.Contains(t, err.Error(), tt.expectedErr)
		})
	}
}

func TestRegister_AlreadyExists(t *testing.T) {
	ctx, st := suite.New(t)

	email := genEmail(testValidEmail)
	pass := genPassword(passLenValid)
	username := genUsername(usernameLen)

	respReg, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    email,
		Password: pass,
		Username: username,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	_, err = st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    email,
		Password: genPassword(passLenValid),
		Username: genUsername(usernameLen),
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "user already exists")

	_, err = st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    genEmail(testValidEmail),
		Password: genPassword(passLenValid),
		Username: username,
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "user already exists")
}

func TestLogin_FailCases(t *testing.T) {
	ctx, st := suite.New(t)

	tests := []struct {
		name        string
		email       string
		password    string
		expectedErr string
	}{
		{
			name:        "Login with Empty Password",
			email:       genEmail(testValidEmail),
			password:    "",
			expectedErr: "password is required",
		},
		{
			name:        "Login with Empty Email",
			email:       "",
			password:    genPassword(passLenValid),
			expectedErr: "email is required",
		},
		{
			name:        "Login with Both Empty Email and Password",
			email:       "",
			password:    "",
			expectedErr: "email is required",
		},
		{
			name:        "Login with Non-Matching Password",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenValid),
			expectedErr: "invalid credentials",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
				Email:    genEmail(testValidEmail),
				Password: genPassword(passLenValid),
				Username: genUsername(usernameLen),
			})
			require.NoError(t, err)

			_, err = st.AuthClient.Login(ctx, &msgv1auth.LoginRequest{
				Email:    tt.email,
				Password: tt.password,
			})
			require.Error(t, err)
			require.Contains(t, err.Error(), tt.expectedErr)
		})
	}
}

func TestGetters_HappyPath(t *testing.T) {
	ctx, st := suite.New(t)

	usernames := make([]string, 0, 2)
	userIDs := make([]string, 0, 2)

	usernames = append(usernames, genUsername(usernameLen))

	respReg, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    genEmail(testValidEmail),
		Password: genPassword(passLenValid),
		Username: usernames[0],
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	userIDs = append(userIDs, respReg.GetUserId())

	usernames = append(usernames, genUsername(usernameLen))
	respReg, err = st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    genEmail(testValidEmail),
		Password: genPassword(passLenValid),
		Username: usernames[1],
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	userIDs = append(userIDs, respReg.GetUserId())

	respUID, err := st.AuthClient.GetUserIDs(ctx, &msgv1auth.GetUserIDsRequest{
		Usernames: usernames,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respUID.GetUserIds())

	respUsrnames, err := st.AuthClient.GetUsernames(ctx, &msgv1auth.GetUsernamesRequest{
		UserIds: userIDs,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respUsrnames.GetUsernames())
}

// Функция генерирует строку из трех случайных букв от 'a' до 'z'

func randomLetters(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
	var result []rune

	for i := 0; i < n; i++ {
		result = append(result, letters[rand.Intn(len(letters))])
	}

	return string(result)
}

func genEmail(input string) string {
	prefix := randomLetters(3)
	return prefix + input
}

func genPassword(len int) string {
	return randomLetters(len)
}

func genUsername(len int) string {
	return randomLetters(len)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
